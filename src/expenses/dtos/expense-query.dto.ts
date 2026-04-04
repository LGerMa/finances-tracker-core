import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '../../common/dtos/page-options.dto';
import { PaymentMethod } from '../enums/expense.enum';

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
    description: 'Comma-separated tag names — returns expenses matching ANY of the tags',
  })
  @IsString()
  @IsOptional()
  tags?: string;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;
}
