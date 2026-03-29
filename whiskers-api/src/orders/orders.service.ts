import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  canTransition,
  computeOrderTotalCents,
  isSuccessfulSquarePaymentStatus,
} from '../domain/order-domain';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SquareClientProvider } from './square.client';

const WEBHOOK_EVENT_TTL_SEC = 60 * 60 * 24 * 30; // 30 days

type SquarePaymentPayload = {
  id?: string;
  status?: string;
  order_id?: string;
  orderId?: string;
};

type SquareWebhookBody = {
  type?: string;
  event_id?: string;
  eventId?: string;
  data?: {
    object?: {
      payment?: SquarePaymentPayload;
    };
  };
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly squareProvider: SquareClientProvider,
    private readonly config: ConfigService,
  ) {}

  async createOrder(dto: {
    items: { flavourId: string; quantity: number }[];
    guestEmail?: string;
    guestPhone?: string;
    userId?: string;
  }) {
    const menuFlavourIds = await this.getTodayMenuFlavourIds();
    if (menuFlavourIds.size === 0) {
      throw new BadRequestException('Today’s menu is empty; cannot place an order');
    }

    const flavourIds = [...new Set(dto.items.map((i) => i.flavourId))];
    const flavours = await this.prisma.flavour.findMany({
      where: {
        id: { in: flavourIds },
        isActive: true,
      },
    });
    const byId = new Map(flavours.map((f) => [f.id, f]));

    const lines: { flavourId: string; name: string; quantity: number; unitPriceCents: number }[] =
      [];
    for (const line of dto.items) {
      if (!menuFlavourIds.has(line.flavourId)) {
        throw new BadRequestException(
          `Flavour ${line.flavourId} is not on today’s menu`,
        );
      }
      const f = byId.get(line.flavourId);
      if (!f) {
        throw new BadRequestException(`Flavour ${line.flavourId} not found or inactive`);
      }
      lines.push({
        flavourId: line.flavourId,
        name: f.name,
        quantity: line.quantity,
        unitPriceCents: f.priceCents,
      });
    }

    const totalCents = computeOrderTotalCents(
      lines.map((l) => ({
        unitPriceCents: l.unitPriceCents,
        quantity: l.quantity,
      })),
    );

    const order = await this.prisma.order.create({
      data: {
        userId: dto.userId,
        guestEmail: dto.guestEmail,
        guestPhone: dto.guestPhone,
        totalCents,
        status: OrderStatus.PENDING,
        items: {
          create: lines.map((l) => ({
            flavourId: l.flavourId,
            quantity: l.quantity,
            unitPriceCents: l.unitPriceCents,
          })),
        },
      },
      include: { items: { include: { flavour: true } } },
    });

    return order;
  }

  async getPublicOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        totalCents: true,
        createdAt: true,
        items: {
          select: {
            quantity: true,
            unitPriceCents: true,
            flavour: { select: { name: true } },
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async createPaymentLink(orderId: string) {
    const accessToken = this.config.get<string>('SQUARE_ACCESS_TOKEN');
    const locationId = this.config.get<string>('SQUARE_LOCATION_ID');
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    const currency = (this.config.get<string>('SQUARE_CURRENCY') ??
      'USD') as 'USD';

    if (!accessToken || !locationId) {
      throw new ServiceUnavailableException(
        'Square is not configured (SQUARE_ACCESS_TOKEN / SQUARE_LOCATION_ID)',
      );
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { flavour: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING) {
      throw new ConflictException('Order is not awaiting payment');
    }
    if (order.squareOrderId) {
      throw new ConflictException('Payment link was already created for this order');
    }

    const client = this.squareProvider.getClient();
    const idempotencyKey = randomUUID();

    const lineItems = order.items.map((it) => ({
      name: it.flavour.name,
      quantity: String(it.quantity),
      itemType: 'ITEM' as const,
      basePriceMoney: {
        amount: BigInt(it.unitPriceCents),
        currency: currency,
      },
    }));

    let squareOrderId: string | undefined;
    let checkoutUrl: string | undefined;

    try {
      const res = await client.checkout.paymentLinks.create({
        idempotencyKey,
        order: {
          locationId,
          referenceId: order.id,
          lineItems,
        },
        checkoutOptions: {
          redirectUrl: `${frontendUrl.replace(/\/$/, '')}/checkout/success?orderId=${encodeURIComponent(order.id)}`,
        },
        paymentNote: `Whiskers ${order.id}`,
      });

      const pl = res.paymentLink;
      squareOrderId = pl?.orderId;
      checkoutUrl = pl?.url ?? pl?.longUrl;
    } catch (e: unknown) {
      this.logger.warn(`Square paymentLinks.create failed: ${String(e)}`);
      throw new BadRequestException(
        'Could not start Square checkout; check Square credentials and location.',
      );
    }

    if (!squareOrderId || !checkoutUrl) {
      throw new BadRequestException('Square did not return a checkout URL');
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { squareOrderId },
    });

    return { checkoutUrl, squareOrderId };
  }

  async handleSquareWebhook(rawBody: string, signatureHeader: string | undefined) {
    const sigKey = this.config.get<string>('SQUARE_WEBHOOK_SIGNATURE_KEY');
    const notificationUrl = this.config.get<string>('SQUARE_WEBHOOK_NOTIFICATION_URL');

    if (sigKey && notificationUrl) {
      const { WebhooksHelper } = await import('square');
      const ok = await WebhooksHelper.verifySignature({
        requestBody: rawBody,
        signatureHeader: signatureHeader ?? '',
        signatureKey: sigKey,
        notificationUrl,
      });
      if (!ok) {
        this.logger.warn('Square webhook signature verification failed');
        return { ok: false, status: 403 as const, duplicate: false };
      }
    } else if (this.config.get<string>('NODE_ENV') === 'production') {
      this.logger.error(
        'SQUARE_WEBHOOK_SIGNATURE_KEY / SQUARE_WEBHOOK_NOTIFICATION_URL required in production',
      );
      return { ok: false, status: 500 as const, duplicate: false };
    }

    let body: SquareWebhookBody;
    try {
      body = JSON.parse(rawBody) as SquareWebhookBody;
    } catch {
      return { ok: false, status: 400 as const, duplicate: false };
    }

    const eventId = body.event_id ?? body.eventId;
    if (!eventId) {
      return { ok: false, status: 400 as const, duplicate: false };
    }

    const dedupeKey = `square:webhook:event:${eventId}`;
    const firstTime = await this.redis.setNx(dedupeKey, '1', WEBHOOK_EVENT_TTL_SEC);
    if (!firstTime) {
      return { ok: true, status: 200 as const, duplicate: true };
    }

    const eventType = body.type ?? '';
    if (!eventType.startsWith('payment.')) {
      return { ok: true, status: 200 as const, duplicate: false };
    }

    const payment = body.data?.object?.payment;
    if (!payment) {
      return { ok: true, status: 200 as const, duplicate: false };
    }

    try {
      await this.applyPaymentToOrder(payment);
    } catch (e) {
      await this.redis.del(dedupeKey);
      throw e;
    }
    return { ok: true, status: 200 as const, duplicate: false };
  }

  private async applyPaymentToOrder(payment: SquarePaymentPayload) {
    const squareOrderId = payment.order_id ?? payment.orderId;
    if (!squareOrderId) {
      this.logger.warn('Square payment webhook missing order id');
      return;
    }

    const status = payment.status;
    if (!isSuccessfulSquarePaymentStatus(status)) {
      return;
    }

    const paymentId = payment.id;

    const order = await this.prisma.order.findFirst({
      where: { squareOrderId },
    });
    if (!order) {
      this.logger.warn(`No local order for Square order ${squareOrderId}`);
      return;
    }

    if (order.status === OrderStatus.PAID) {
      if (paymentId && order.squarePaymentId !== paymentId) {
        this.logger.warn(
          `Order ${order.id} already PAID; ignoring additional payment ${paymentId}`,
        );
      }
      return;
    }

    if (!canTransition(order.status, OrderStatus.PAID)) {
      this.logger.warn(
        `Cannot mark order ${order.id} PAID from status ${order.status}`,
      );
      return;
    }

    const updated = await this.prisma.order.updateMany({
      where: {
        id: order.id,
        status: OrderStatus.PENDING,
      },
      data: {
        status: OrderStatus.PAID,
        squarePaymentId: paymentId ?? undefined,
      },
    });
    if (updated.count === 0) {
      this.logger.warn(
        `Order ${order.id} was not PENDING when applying payment (race or replay)`,
      );
    }
  }

  private async getTodayMenuFlavourIds(): Promise<Set<string>> {
    const slots = await this.prisma.menuSlot.findMany({
      include: { flavour: true },
    });
    return new Set(
      slots.filter((s) => s.flavour.isActive).map((s) => s.flavourId),
    );
  }
}
