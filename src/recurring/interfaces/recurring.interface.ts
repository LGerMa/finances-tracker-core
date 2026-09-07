export interface IRecurringTag {
  id: string;
  name: string;
  color: string;
}

export interface IRecurringPaymentSource {
  id: string;
  alias: string;
  color: string;
}

export interface IRecurringEntry {
  id: string;
  entryType: string;
  amount: number;
  description: string | null;
  paymentMethod: string | null;
  incomeType: string | null;
  frequency: string;
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  nextDate: string;
  isActive: boolean;
  tags: IRecurringTag[];
  paymentSource: IRecurringPaymentSource | null;
  createdAt: Date;
}
