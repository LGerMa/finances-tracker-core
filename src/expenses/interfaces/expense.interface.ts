export interface IExpenseTag {
  id: string;
  name: string;
  color: string;
}

export interface IExpense {
  id: string;
  amount: number;
  paymentMethod: string;
  description: string | null;
  date: string;
  tags: IExpenseTag[];
  createdAt: Date;
}
