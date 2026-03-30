import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  InternalServerErrorException,
  Param,
  Query,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
  type RawBodyRequest,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CreateOrderDto } from './dto/orders.dto';
import { OrdersPaginationQueryDto } from './dto/orders-pagination.dto';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  listMyOrders(
    @CurrentUser() user: AuthUser,
    @Query() query: OrdersPaginationQueryDto,
  ) {
    return this.orders.listOrdersForUser(user.id, query);
  }

  @Post('webhook')
  @HttpCode(200)
  async squareWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-square-hmacsha256-signature') signature: string | undefined,
  ) {
    const raw = req.rawBody;
    if (!raw || !Buffer.isBuffer(raw)) {
      throw new BadRequestException('raw_body_required');
    }
    const result = await this.orders.handleSquareWebhook(
      raw.toString('utf8'),
      signature,
    );
    if (!result.ok) {
      if (result.status === 403) throw new ForbiddenException();
      if (result.status === 500) throw new InternalServerErrorException();
      throw new BadRequestException();
    }
    return { received: true, duplicate: result.duplicate };
  }

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    const order = await this.orders.createOrder({
      items: dto.items,
      guestEmail: dto.guestEmail,
      guestPhone: dto.guestPhone,
    });
    return {
      id: order.id,
      status: order.status,
      totalCents: order.totalCents,
      items: order.items.map((i) => ({
        flavourId: i.flavourId,
        name: i.flavour.name,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
      })),
    };
  }

  @Get(':id')
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.orders.getPublicOrder(id);
  }

  @Post(':id/pay')
  async pay(@Param('id', ParseUUIDPipe) id: string) {
    return this.orders.createPaymentLink(id);
  }
}
