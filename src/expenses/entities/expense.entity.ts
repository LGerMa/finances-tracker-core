import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../common/entities/abstract.entity';
import { User } from '../../users/entities/user.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { PaymentMethod } from '../enums/expense.enum';
import { Source } from '../../common/enums/source.enum';

@Entity('expenses')
export class Expense extends AbstractEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'payment_method', type: 'varchar', length: 50 })
  paymentMethod: PaymentMethod;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar', length: 50, default: Source.WEB })
  source: Source;

  @Column({ name: 'receipt_url', type: 'text', nullable: true })
  receiptUrl: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'expense_tags',
    joinColumn: { name: 'expense_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];
}
