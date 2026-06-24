import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsUUID,
  Min,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { IsExists } from '@libs/shared';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from '../../../i18n/i18n-types';

export class OrderItemDto {
  @ApiProperty({
    description: 'UUID of the item to order',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>(
      'orders.property_required',
      {
        args: { property: 'item_id' },
      },
    ),
  })
  @IsUUID('7', {
    message: i18nValidationMessage<I18nTranslations>(
      'orders.property_not_valid',
      {
        args: { property: 'item_id' },
      },
    ),
  })
  @IsExists('items', {
    message: i18nValidationMessage<I18nTranslations>('orders.invalid_id', {
      args: { id: 'item_id' },
    }),
  })
  item_id!: string;

  @ApiProperty({
    description: 'Quantity to order (must be at least 1)',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'List of items to order',
    type: [OrderItemDto],
  })
  @IsArray()
  @ArrayMinSize(1, {
    message: i18nValidationMessage<I18nTranslations>(
      'orders.property_required',
      {
        args: { property: 'items' },
      },
    ),
  })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}
