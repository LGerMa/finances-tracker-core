export interface IIncomeTag {
  id: string;
  name: string;
  color: string;
}

export interface IIncome {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  date: string;
  tags: IIncomeTag[];
  createdAt: Date;
}
