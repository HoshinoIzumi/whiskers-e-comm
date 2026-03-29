import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async listForAdmin(params: { skip: number; take: number }) {
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        include: { profile: true },
      }),
      this.prisma.user.count(),
    ]);
    return { items, total };
  }

  async updateByAdmin(id: string, data: { role?: Role; isActive?: boolean }) {
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data,
      include: { profile: true },
    });
  }

  toPublicUser(user: {
    id: string;
    email: string;
    role: Role;
    isActive: boolean;
    createdAt: Date;
    profile: { phone: string | null; address: string | null } | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      profile: user.profile
        ? { phone: user.profile.phone, address: user.profile.address }
        : null,
    };
  }
}
