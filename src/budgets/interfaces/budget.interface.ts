export interface IBudgetTag {
  id: string;
  name: string;
  color: string;
}

export interface IBudget {
  id: string;
  tag: IBudgetTag;
  amount: number;
  createdAt: Date;
}

export type BudgetStatusLevel = 'normal' | 'warning' | 'over';

export interface IBudgetStatus {
  tag: IBudgetTag;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatusLevel;
}
