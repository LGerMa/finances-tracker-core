import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Min,
} from 'class-validator';
import { PaymentMethod } from '../enums/expense.enum';
import { Source } from '../../common/enums/source.enum';

export class CreateExpenseDto {
  @ApiProperty({ example: 45.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 'Lunch at restaurant' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2026-03-28' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ enum: Source, default: Source.WEB })
  @IsEnum(Source)
  @IsOptional()
  source?: Source;

  @ApiPropertyOptional({ example: 'https://example.com/receipt.jpg' })
  @IsUrl()
  @IsOptional()
  receiptUrl?: string;

  @ApiPropertyOptional({ type: [String], example: ['uuid-1', 'uuid-2'] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  tagIds?: string[];
}

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}
