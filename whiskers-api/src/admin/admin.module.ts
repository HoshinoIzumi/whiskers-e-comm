import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [UsersModule, AuditModule, OrdersModule],
  controllers: [AdminController],
})
export class AdminModule {}
