export interface IExpenseTag {
  id: string;
  name: string;
  color: string;
}

export interface IExpensePaymentSource {
  id: string;
  alias: string;
  color: string;
}

export interface IExpense {
  id: string;
  amount: number;
  paymentMethod: string;
  type: string;
  description: string | null;
  date: string;
  source: string;
  receiptUrl: string | null;
  tags: IExpenseTag[];
  paymentSource: IExpensePaymentSource | null;
  createdAt: Date;
}
