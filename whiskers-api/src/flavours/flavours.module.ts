import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { FlavoursController } from './flavours.controller';
import { FlavoursService } from './flavours.service';

@Module({
  imports: [PrismaModule, AuditModule, RedisModule],
  controllers: [FlavoursController],
  providers: [FlavoursService],
  exports: [FlavoursService],
})
export class FlavoursModule {}
