import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../../expenses/enums/expense.enum';
import { IPaymentSource } from '../interfaces/payment-source.interface';

export class PaymentSourceResponse implements IPaymentSource {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'visa 8943' })
  alias: string;

  @ApiProperty({ enum: PaymentMethod, nullable: true })
  paymentMethod: string | null;

  @ApiProperty({ example: '#3B82F6' })
  color: string;

  @ApiProperty()
  createdAt: Date;
}
