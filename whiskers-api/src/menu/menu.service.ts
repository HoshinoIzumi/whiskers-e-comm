import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MENU_CACHE_KEY } from './menu.constants';

const MENU_CACHE_TTL_SEC = 300;

const flavourInclude = {
  categories: { include: { category: true } },
} as const;

type MenuPayload = {
  items: Array<{
    sortOrder: number;
    flavour: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      priceCents: number;
      isActive: boolean;
      imageUrl: string | null;
      createdAt: Date;
      updatedAt: Date;
      categories: Array<{ id: string; name: string; slug: string }>;
    };
  }>;
};

@Injectable()
export class MenuService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly audit: AuditService,
  ) {}

  async getMenu(): Promise<MenuPayload> {
    const cached = await this.redis.get(MENU_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as MenuPayload;
    }
    const fresh = await this.loadMenuFromDb();
    await this.redis.set(
      MENU_CACHE_KEY,
      JSON.stringify(fresh),
      MENU_CACHE_TTL_SEC,
    );
    return fresh;
  }

  private async loadMenuFromDb(): Promise<MenuPayload> {
    const slots = await this.prisma.menuSlot.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { flavour: { include: flavourInclude } },
    });
    const items = slots
      .filter((s) => s.flavour.isActive)
      .map((s) => ({
        sortOrder: s.sortOrder,
        flavour: this.serializeFlavour(s.flavour),
      }));
    return { items };
  }

  async replaceMenu(
    items: { flavourId: string; sortOrder: number }[],
    actorId: string,
  ) {
    if (items.length !== new Set(items.map((i) => i.flavourId)).size) {
      throw new BadRequestException('Duplicate flavourId in menu payload');
    }
    const flavourIds = items.map((i) => i.flavourId);
    const flavours = await this.prisma.flavour.findMany({
      where: { id: { in: flavourIds } },
    });
    if (flavours.length !== flavourIds.length) {
      throw new NotFoundException('One or more flavours not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.menuSlot.deleteMany();
      if (items.length) {
        await tx.menuSlot.createMany({
          data: items.map((i) => ({
            flavourId: i.flavourId,
            sortOrder: i.sortOrder,
          })),
        });
      }
    });

    await this.audit.log({
      actorId,
      action: 'menu.replace',
      entityType: 'Menu',
      metadata: { count: items.length },
    });
    await this.invalidateMenuCache();
    return this.loadMenuFromDb();
  }

  async patchToday(flavourIds: string[], actorId: string) {
    const unique = [...new Set(flavourIds)];
    const flavours = await this.prisma.flavour.findMany({
      where: { id: { in: unique }, isActive: true },
    });
    if (flavours.length !== unique.length) {
      throw new BadRequestException(
        'All flavourIds must exist and be active for today’s menu',
      );
    }

    const items = unique.map((flavourId, index) => ({
      flavourId,
      sortOrder: index,
    }));

    await this.prisma.$transaction(async (tx) => {
      await tx.menuSlot.deleteMany();
      if (items.length) {
        await tx.menuSlot.createMany({
          data: items.map((i) => ({
            flavourId: i.flavourId,
            sortOrder: i.sortOrder,
          })),
        });
      }
    });

    await this.audit.log({
      actorId,
      action: 'menu.patch_today',
      entityType: 'Menu',
      metadata: { flavourCount: unique.length },
    });
    await this.invalidateMenuCache();
    return this.loadMenuFromDb();
  }

  private async invalidateMenuCache() {
    await this.redis.del(MENU_CACHE_KEY);
  }

  private serializeFlavour(
    flavour: Prisma.FlavourGetPayload<{ include: typeof flavourInclude }>,
  ) {
    return {
      id: flavour.id,
      name: flavour.name,
      slug: flavour.slug,
      description: flavour.description,
      priceCents: flavour.priceCents,
      isActive: flavour.isActive,
      imageUrl: flavour.imageUrl,
      createdAt: flavour.createdAt,
      updatedAt: flavour.updatedAt,
      categories: flavour.categories.map((fc) => ({
        id: fc.category.id,
        name: fc.category.name,
        slug: fc.category.slug,
      })),
    };
  }
}
