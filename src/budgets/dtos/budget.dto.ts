import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID, Min } from 'class-validator';

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
