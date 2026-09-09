import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PageOptionsDto } from '../../common/dtos/page-options.dto';
import { PaymentMethod, ExpenseType } from '../enums/expense.enum';

export class ExpenseQueryDto extends PageOptionsDto {
  @ApiPropertyOptional({ example: '2026-03-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-03-31' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    example: 'food,transport',
    description:
      'Comma-separated tag names — returns expenses matching ANY of the tags',
  })
  @IsString()
  @IsOptional()
  tags?: string;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ enum: ExpenseType })
  @IsEnum(ExpenseType)
  @IsOptional()
  type?: ExpenseType;

  @ApiPropertyOptional({
    example: 'a3f1c2d4-5b6e-7f80-9a1b-2c3d4e5f6071',
    description: 'Filter to expenses attributed to this payment source id',
  })
  @IsUUID('4')
  @IsOptional()
  paymentSourceId?: string;
}
