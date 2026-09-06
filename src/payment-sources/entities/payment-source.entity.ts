import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../common/entities/abstract.entity';
import { User } from '../../users/entities/user.entity';
import { PaymentMethod } from '../../expenses/enums/expense.enum';

@Entity('payment_sources')
@Index('ux_payment_sources_user_alias_active', ['userId', 'alias'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class PaymentSource extends AbstractEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 100 })
  alias: string;

  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  paymentMethod: PaymentMethod | null;

  @Column({ length: 7, default: '#6B7280' })
  color: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
