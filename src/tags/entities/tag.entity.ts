import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { AbstractEntity } from '../../common/entities/abstract.entity';
import { User } from '../../users/entities/user.entity';

@Entity('tags')
@Unique(['userId', 'name'])
export class Tag extends AbstractEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 7, default: '#6B7280' })
  color: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
