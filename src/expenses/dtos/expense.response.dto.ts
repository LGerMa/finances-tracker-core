import { ApiProperty } from '@nestjs/swagger';
import { IExpense, IExpenseTag } from '../interfaces/expense.interface';
import { PaymentMethod } from '../enums/expense.enum';

export class ExpenseTagItem implements IExpenseTag {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ example: '#EF4444' }) color: string;
}

export class ExpenseResponse implements IExpense {
  @ApiProperty() id: string;
  @ApiProperty() amount: number;
  @ApiProperty({ enum: PaymentMethod }) paymentMethod: string;
  @ApiProperty({ nullable: true }) description: string | null;
  @ApiProperty({ example: '2026-03-28' }) date: string;
  @ApiProperty({ type: () => [ExpenseTagItem] }) tags: ExpenseTagItem[];
  @ApiProperty() createdAt: Date;
}
