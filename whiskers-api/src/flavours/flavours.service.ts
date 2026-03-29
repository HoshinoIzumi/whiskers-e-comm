import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { MENU_CACHE_KEY } from '../menu/menu.constants';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { slugify } from '../common/slug';
import type {
  CreateFlavourDto,
  QueryFlavourDto,
  UpdateFlavourDto,
} from './dto/flavour.dto';

const flavourInclude = {
  categories: { include: { category: true } },
} as const;

@Injectable()
export class FlavoursService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly redis: RedisService,
  ) {}

  private buildWhere(
    filters: Pick<QueryFlavourDto, 'categoryId' | 'search'>,
  ): Prisma.FlavourWhereInput {
    const q = filters.search?.trim();
    return {
      isActive: true,
      ...(filters.categoryId && {
        categories: { some: { categoryId: filters.categoryId } },
      }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      }),
    };
  }

  async listPublic(query: QueryFlavourDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(query);

    const [items, total] = await Promise.all([
      this.prisma.flavour.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: flavourInclude,
      }),
      this.prisma.flavour.count({ where }),
    ]);

    return {
      data: items.map((f) => this.serialize(f)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async listToday() {
    const slots = await this.prisma.menuSlot.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { flavour: { include: flavourInclude } },
    });
    return slots
      .filter((s) => s.flavour.isActive)
      .map((s) => this.serialize(s.flavour));
  }

  async getById(id: string) {
    const flavour = await this.prisma.flavour.findFirst({
      where: { id, isActive: true },
      include: flavourInclude,
    });
    if (!flavour) throw new NotFoundException('Flavour not found');
    return this.serialize(flavour);
  }

  async getByIdForStaff(id: string) {
    const flavour = await this.prisma.flavour.findUnique({
      where: { id },
      include: flavourInclude,
    });
    if (!flavour) throw new NotFoundException('Flavour not found');
    return this.serialize(flavour);
  }

  async create(dto: CreateFlavourDto, actorId: string) {
    const slug = dto.slug?.trim() || slugify(dto.name);
    try {
      const flavour = await this.prisma.flavour.create({
        data: {
          name: dto.name.trim(),
          slug,
          description: dto.description?.trim(),
          priceCents: dto.priceCents,
          imageUrl: dto.imageUrl,
          categories: dto.categoryIds?.length
            ? {
                createMany: {
                  data: dto.categoryIds.map((categoryId) => ({ categoryId })),
                  skipDuplicates: true,
                },
              }
            : undefined,
        },
        include: flavourInclude,
      });
      await this.audit.log({
        actorId,
        action: 'flavour.create',
        entityType: 'Flavour',
        entityId: flavour.id,
        metadata: { name: flavour.name },
      });
      await this.redis.del(MENU_CACHE_KEY);
      return this.serialize(flavour);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Slug already exists');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateFlavourDto, actorId: string) {
    await this.getByIdForStaff(id);
    try {
      const flavour = await this.prisma.$transaction(async (tx) => {
        if (dto.categoryIds) {
          await tx.flavourCategory.deleteMany({ where: { flavourId: id } });
          if (dto.categoryIds.length) {
            await tx.flavourCategory.createMany({
              data: dto.categoryIds.map((categoryId) => ({
                flavourId: id,
                categoryId,
              })),
              skipDuplicates: true,
            });
          }
        }
        return tx.flavour.update({
          where: { id },
          data: {
            ...(dto.name && { name: dto.name.trim() }),
            ...(dto.slug && { slug: dto.slug.trim() }),
            ...(dto.description !== undefined && {
              description: dto.description?.trim(),
            }),
            ...(dto.priceCents !== undefined && { priceCents: dto.priceCents }),
            ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
            ...(dto.isActive !== undefined && { isActive: dto.isActive }),
          },
          include: flavourInclude,
        });
      });
      await this.audit.log({
        actorId,
        action: 'flavour.update',
        entityType: 'Flavour',
        entityId: id,
        metadata: dto as object,
      });
      await this.redis.del(MENU_CACHE_KEY);
      return this.serialize(flavour);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Slug already exists');
      }
      throw e;
    }
  }

  async remove(id: string, actorId: string) {
    await this.getByIdForStaff(id);
    const orderCount = await this.prisma.orderItem.count({
      where: { flavourId: id },
    });
    if (orderCount > 0) {
      throw new BadRequestException(
        'Cannot delete a flavour that appears on past orders; deactivate instead',
      );
    }
    await this.prisma.$transaction([
      this.prisma.menuSlot.deleteMany({ where: { flavourId: id } }),
      this.prisma.flavourCategory.deleteMany({ where: { flavourId: id } }),
      this.prisma.flavour.delete({ where: { id } }),
    ]);
    await this.audit.log({
      actorId,
      action: 'flavour.delete',
      entityType: 'Flavour',
      entityId: id,
    });
    await this.redis.del(MENU_CACHE_KEY);
    return { ok: true };
  }

  private serialize(
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
