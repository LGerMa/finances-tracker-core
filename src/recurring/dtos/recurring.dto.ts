import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { EntryType, Frequency } from '../enums/recurring.enum';

export class CreateRecurringDto {
  @ApiProperty({ enum: EntryType, example: EntryType.EXPENSE })
  @IsEnum(EntryType)
  entryType: EntryType;

  @ApiProperty({ example: 6.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'Netflix' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'credit_card', description: 'Required when entryType is expense' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'fixed_monthly', description: 'Required when entryType is income' })
  @IsString()
  @IsOptional()
  incomeType?: string;

  @ApiProperty({ enum: Frequency, example: Frequency.MONTHLY })
  @IsEnum(Frequency)
  frequency: Frequency;

  @ApiPropertyOptional({ example: 15, description: 'Day of month (1-28) for monthly frequency' })
  @IsInt()
  @Min(1)
  @Max(28)
  @IsOptional()
  dayOfMonth?: number;

  @ApiPropertyOptional({ example: 1, description: 'Day of week (0=Sun, 6=Sat) for weekly frequency' })
  @IsInt()
  @Min(0)
  @Max(6)
  @IsOptional()
  dayOfWeek?: number;

  @ApiProperty({ example: '2026-05-01' })
  @IsDateString()
  nextDate: string;

  @ApiPropertyOptional({ type: [String], example: ['uuid-1'] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  tagIds?: string[];
}

export class UpdateRecurringDto extends PartialType(CreateRecurringDto) {}
