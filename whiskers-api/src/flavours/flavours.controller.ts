import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import {
  CreateFlavourDto,
  QueryFlavourDto,
  UpdateFlavourDto,
} from './dto/flavour.dto';
import { FlavoursService } from './flavours.service';

@ApiTags('flavours')
@Controller('flavours')
export class FlavoursController {
  constructor(private readonly flavours: FlavoursService) {}

  @Get()
  list(@Query() query: QueryFlavourDto) {
    return this.flavours.listPublic(query);
  }

  @Get('today')
  today() {
    return this.flavours.listToday();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.flavours.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiBearerAuth()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateFlavourDto) {
    return this.flavours.create(dto, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiBearerAuth()
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateFlavourDto,
  ) {
    return this.flavours.update(id, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiBearerAuth()
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.flavours.remove(id, user.id);
  }
}
