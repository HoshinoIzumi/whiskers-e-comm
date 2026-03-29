import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { SquareClientProvider } from './square.client';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [OrdersController],
  providers: [OrdersService, SquareClientProvider],
  exports: [OrdersService],
})
export class OrdersModule {}
