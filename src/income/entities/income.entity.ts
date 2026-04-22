import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../common/entities/abstract.entity';
import { User } from '../../users/entities/user.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { IncomeType } from '../enums/income.enum';
import { Source } from '../../common/enums/source.enum';

@Entity('income')
export class Income extends AbstractEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 50 })
  type: IncomeType;

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
    name: 'income_tags',
    joinColumn: { name: 'income_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];
}
