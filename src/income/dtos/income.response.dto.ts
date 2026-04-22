import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IIncome, IIncomeTag } from '../interfaces/income.interface';
import { IncomeType } from '../enums/income.enum';
import { Source } from '../../common/enums/source.enum';

export class IncomeTagItem implements IIncomeTag {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ example: '#22C55E' }) color: string;
}

export class IncomeResponse implements IIncome {
  @ApiProperty() id: string;
  @ApiProperty() amount: number;
  @ApiProperty({ enum: IncomeType }) type: string;
  @ApiProperty({ nullable: true }) description: string | null;
  @ApiProperty({ example: '2026-03-01' }) date: string;
  @ApiProperty({ enum: Source }) source: string;
  @ApiPropertyOptional({ nullable: true }) receiptUrl: string | null;
  @ApiProperty({ type: () => [IncomeTagItem] }) tags: IncomeTagItem[];
  @ApiProperty() createdAt: Date;
}
