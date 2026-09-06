import { ApiProperty } from '@nestjs/swagger';
import {
  IBudget,
  IBudgetStatus,
  IBudgetTag,
  BudgetStatusLevel,
} from '../interfaces/budget.interface';

export class BudgetTagItem implements IBudgetTag {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ example: '#EF4444' }) color: string;
}

export class BudgetResponse implements IBudget {
  @ApiProperty() id: string;
  @ApiProperty({ type: () => BudgetTagItem }) tag: BudgetTagItem;
  @ApiProperty() amount: number;
  @ApiProperty() createdAt: Date;
}

export class BudgetStatusResponse implements IBudgetStatus {
  @ApiProperty({ type: () => BudgetTagItem }) tag: BudgetTagItem;
  @ApiProperty() budget: number;
  @ApiProperty() spent: number;
  @ApiProperty() remaining: number;
  @ApiProperty() percentage: number;
  @ApiProperty({ enum: ['normal', 'warning', 'over'] })
  status: BudgetStatusLevel;
}
