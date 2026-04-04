import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class SummaryQueryDto {
  @ApiPropertyOptional({ description: 'Month in YYYY-MM format', example: '2026-03' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be in YYYY-MM format' })
  month?: string;
}

export class ByTagsQueryDto {
  @ApiPropertyOptional({ description: 'Month in YYYY-MM format', example: '2026-03' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be in YYYY-MM format' })
  month?: string;

  @ApiPropertyOptional({ enum: ['expense', 'income'], default: 'expense' })
  @IsOptional()
  @IsIn(['expense', 'income'])
  type?: 'expense' | 'income';
}

export class CompareTagsQueryDto {
  @ApiProperty({ description: 'Comma-separated tag names (2–5)', example: 'food,transport' })
  @IsNotEmpty()
  @IsString()
  tags: string;

  @ApiPropertyOptional({ description: 'How many months back to compare', default: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(24)
  months?: number;

  @ApiPropertyOptional({ enum: ['expense', 'income'], default: 'expense' })
  @IsOptional()
  @IsIn(['expense', 'income'])
  type?: 'expense' | 'income';
}

export class TrendsQueryDto {
  @ApiPropertyOptional({ description: 'How many months back', default: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  months?: number;
}
