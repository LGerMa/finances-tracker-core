import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IExpense,
  IExpenseTag,
  IExpensePaymentSource,
} from '../interfaces/expense.interface';
import { PaymentMethod } from '../enums/expense.enum';
import { Source } from '../../common/enums/source.enum';

export class ExpenseTagItem implements IExpenseTag {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ example: '#EF4444' }) color: string;
}

export class ExpensePaymentSourceItem implements IExpensePaymentSource {
  @ApiProperty() id: string;
  @ApiProperty({ example: 'visa 8943' }) alias: string;
  @ApiProperty({ example: '#3B82F6' }) color: string;
}

export class ExpenseResponse implements IExpense {
  @ApiProperty() id: string;
  @ApiProperty() amount: number;
  @ApiProperty({ enum: PaymentMethod }) paymentMethod: string;
  @ApiProperty({ nullable: true }) description: string | null;
  @ApiProperty({ example: '2026-03-28' }) date: string;
  @ApiProperty({ enum: Source }) source: string;
  @ApiPropertyOptional({ nullable: true }) receiptUrl: string | null;
  @ApiProperty({ type: () => [ExpenseTagItem] }) tags: ExpenseTagItem[];
  @ApiProperty({ type: () => ExpensePaymentSourceItem, nullable: true })
  paymentSource: ExpensePaymentSourceItem | null;
  @ApiProperty() createdAt: Date;
}
