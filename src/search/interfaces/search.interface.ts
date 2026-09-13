export interface ISearchTag {
  id: string;
  name: string;
  color: string;
}

export interface ISearchExpenseItem {
  id: string;
  description: string | null;
  amount: number;
  date: string;
  tags: ISearchTag[];
}

export interface ISearchIncomeItem {
  id: string;
  description: string | null;
  amount: number;
  date: string;
  tags: ISearchTag[];
}

export interface ISearchTagItem {
  id: string;
  name: string;
  color: string;
}

export interface ISearchResult {
  expenses: ISearchExpenseItem[];
  income: ISearchIncomeItem[];
  tags: ISearchTagItem[];
}
