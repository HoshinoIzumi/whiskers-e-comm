import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import { OrdersService } from '../orders/orders.service';
import { UpdateOrderStatusDto } from '../orders/dto/update-order-status.dto';
import { UsersService } from '../users/users.service';
import { AdminUpdateUserDto, PaginationQueryDto } from './dto/admin.dto';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly users: UsersService,
    private readonly audit: AuditService,
    private readonly orders: OrdersService,
  ) {}

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  async listUsers(@Query() query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const { items, total } = await this.users.listForAdmin({
      skip,
      take: limit,
    });
    return {
      data: items.map((u) => this.users.toPublicUser(u)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  @Patch('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  async updateUser(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    const user = await this.users.updateByAdmin(id, dto);
    return this.users.toPublicUser(user);
  }

  @Get('audit-logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiBearerAuth()
  async auditLogs(@Query() query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const { items, total } = await this.audit.list({ skip, take: limit });
    return {
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiBearerAuth()
  async listOrders(@Query() query: PaginationQueryDto) {
    return this.orders.listOrdersForAdmin(query);
  }

  @Patch('orders/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiBearerAuth()
  async updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.orders.updateOrderStatus({
      orderId: id,
      to: dto.status,
      actorId: user.id,
    });
  }
}
