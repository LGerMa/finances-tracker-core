import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
import { AbstractEntity } from '../../common/entities/abstract.entity';
import { User } from '../../users/entities/user.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { PaymentSource } from '../../payment-sources/entities/payment-source.entity';
import { EntryType, Frequency } from '../enums/recurring.enum';

@Entity('recurring_entries')
export class RecurringEntry extends AbstractEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'entry_type', type: 'varchar', length: 10 })
  entryType: EntryType;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  paymentMethod: string | null;

  @Column({ name: 'income_type', type: 'varchar', length: 50, nullable: true })
  incomeType: string | null;

  @Column({ name: 'payment_source_id', type: 'uuid', nullable: true })
  paymentSourceId: string | null;

  @Column({ type: 'varchar', length: 20 })
  frequency: Frequency;

  @Column({ name: 'day_of_month', type: 'int', nullable: true })
  dayOfMonth: number | null;

  @Column({ name: 'day_of_week', type: 'int', nullable: true })
  dayOfWeek: number | null;

  @Column({ name: 'next_date', type: 'date' })
  nextDate: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => PaymentSource, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  @JoinColumn({ name: 'payment_source_id' })
  paymentSource: PaymentSource | null;

  @ManyToMany(() => Tag, { eager: true })
  @JoinTable({
    name: 'recurring_entry_tags',
    joinColumn: { name: 'recurring_entry_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];
}
