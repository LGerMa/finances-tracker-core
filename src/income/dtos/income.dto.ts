import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { IncomeType } from '../enums/income.enum';

export class CreateIncomeDto {
  @ApiProperty({ example: 2500.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: IncomeType, example: IncomeType.FIXED_MONTHLY })
  @IsEnum(IncomeType)
  type: IncomeType;

  @ApiPropertyOptional({ example: 'Monthly salary' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2026-03-01' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ type: [String], example: ['uuid-1'] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  tagIds?: string[];
}

export class UpdateIncomeDto extends PartialType(CreateIncomeDto) {}
