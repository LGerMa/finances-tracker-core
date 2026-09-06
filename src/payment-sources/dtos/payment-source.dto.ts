import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsHexColor,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaymentMethod } from '../../expenses/enums/expense.enum';

export class CreatePaymentSourceDto {
  @ApiProperty({ example: 'visa 8943' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  alias: string;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ example: '#3B82F6' })
  @IsHexColor()
  @IsOptional()
  color?: string;
}

export class UpdatePaymentSourceDto extends PartialType(
  CreatePaymentSourceDto,
) {}
