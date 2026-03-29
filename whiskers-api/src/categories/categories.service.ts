import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../common/slug';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async create(input: { name: string; slug?: string }) {
    const slug = input.slug?.trim() || slugify(input.name);
    try {
      return await this.prisma.category.create({
        data: { name: input.name.trim(), slug },
      });
    } catch {
      throw new ConflictException('Category slug already exists');
    }
  }

  async update(id: string, input: { name?: string; slug?: string }) {
    await this.ensureExists(id);
    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          ...(input.name && { name: input.name.trim() }),
          ...(input.slug && { slug: input.slug.trim() }),
        },
      });
    } catch {
      throw new ConflictException('Category slug already exists');
    }
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }

  private async ensureExists(id: string) {
    const c = await this.prisma.category.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Category not found');
  }
}
