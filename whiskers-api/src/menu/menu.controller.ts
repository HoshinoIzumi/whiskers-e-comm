import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import { PatchTodayDto, ReplaceMenuDto } from './dto/menu.dto';
import { MenuService } from './menu.service';

@ApiTags('menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menu: MenuService) {}

  @Get()
  getMenu() {
    return this.menu.getMenu();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiBearerAuth()
  replaceMenu(@CurrentUser() user: AuthUser, @Body() dto: ReplaceMenuDto) {
    return this.menu.replaceMenu(dto.items, user.id);
  }

  @Patch('today')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiBearerAuth()
  patchToday(@CurrentUser() user: AuthUser, @Body() dto: PatchTodayDto) {
    return this.menu.patchToday(dto.flavourIds, user.id);
  }
}
