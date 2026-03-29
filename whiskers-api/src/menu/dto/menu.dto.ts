import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class MenuItemDto {
  @IsUUID()
  flavourId!: string;

  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class ReplaceMenuDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuItemDto)
  items!: MenuItemDto[];
}

export class PatchTodayDto {
  @IsArray()
  @ArrayMinSize(0)
  @IsUUID('4', { each: true })
  flavourIds!: string[];
}
