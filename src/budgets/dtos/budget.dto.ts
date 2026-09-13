import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';

export class CreateBudgetDto {
  @ApiProperty({ example: 'uuid-of-tag' })
  @IsUUID('4')
  tagId: string;

  @ApiProperty({ example: 300 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;
}

export class UpdateBudgetDto {
  @ApiProperty({ example: 350 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;
}

export class BudgetStatusQueryDto {
  @ApiPropertyOptional({
    description: 'Month in YYYY-MM format',
    example: '2026-03',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be in YYYY-MM format' })
  month?: string;
}
