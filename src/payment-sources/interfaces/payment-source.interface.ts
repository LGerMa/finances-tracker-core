export interface IPaymentSource {
  id: string;
  alias: string;
  paymentMethod: string | null;
  color: string;
  createdAt: Date;
}
