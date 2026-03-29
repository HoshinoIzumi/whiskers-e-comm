import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

const REFRESH_DAYS_DEFAULT = 7;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly users: UsersService,
  ) {}

  async register(email: string, password: string) {
    const normalized = email.toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email: normalized },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: normalized,
        passwordHash,
        role: Role.CUSTOMER,
        profile: { create: {} },
      },
      include: { profile: true },
    });

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    await this.persistRefreshToken(user.id, tokens.refreshTokenRaw);
    return {
      user: this.users.toPublicUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshTokenRaw,
      expiresInSec: Number(this.config.get('JWT_ACCESS_EXPIRES_SEC', '900')),
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true },
    });
    if (!user?.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    await this.persistRefreshToken(user.id, tokens.refreshTokenRaw);
    return {
      user: this.users.toPublicUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshTokenRaw,
      expiresInSec: Number(this.config.get('JWT_ACCESS_EXPIRES_SEC', '900')),
    };
  }

  async refresh(refreshToken: string) {
    const hash = this.hashToken(refreshToken);
    const row = await this.prisma.refreshToken.findFirst({
      where: { tokenHash: hash },
    });
    if (!row || row.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: row.userId },
      include: { profile: true },
    });
    if (!user?.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: row.id } });

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    await this.persistRefreshToken(user.id, tokens.refreshTokenRaw);
    return {
      user: this.users.toPublicUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshTokenRaw,
      expiresInSec: Number(this.config.get('JWT_ACCESS_EXPIRES_SEC', '900')),
    };
  }

  async logout(refreshToken: string) {
    const hash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.deleteMany({ where: { tokenHash: hash } });
    return { ok: true };
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private async persistRefreshToken(userId: string, raw: string) {
    const days = Number(
      this.config.get<string>('JWT_REFRESH_EXPIRES_DAYS') ??
        String(REFRESH_DAYS_DEFAULT),
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(raw),
        expiresAt,
      },
    });
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: Role,
  ): Promise<{ accessToken: string; refreshTokenRaw: string }> {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, role },
      {
        secret: this.config.get<string>('JWT_SECRET', 'dev-insecure-change-me'),
        expiresIn: Number(this.config.get('JWT_ACCESS_EXPIRES_SEC', '900')),
      },
    );
    const refreshTokenRaw = randomBytes(48).toString('hex');
    return { accessToken, refreshTokenRaw };
  }
}
