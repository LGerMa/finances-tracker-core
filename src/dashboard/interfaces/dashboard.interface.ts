export interface IDashboardSummary {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  expenseCount: number;
  incomeCount: number;
}

export interface ITagBreakdownTag {
  id: string;
  name: string;
  color: string;
}

export interface ITagBreakdownItem {
  tag?: ITagBreakdownTag;
  untagged?: boolean;
  total: number;
  count: number;
}

export interface ICompareTagMonth {
  month: string;
  total: number;
}

export interface ICompareTagItem {
  tag: ITagBreakdownTag;
  months: ICompareTagMonth[];
  average: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ICompareTags {
  period: { from: string; to: string };
  tags: ICompareTagItem[];
}

export interface ITrendItem {
  month: string;
  totalIncome: number;
  totalExpenses: number;
}
