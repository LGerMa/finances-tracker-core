import { AbstractEntity } from '../../common/entities/abstract.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class User extends AbstractEntity {
  @Column({ unique: true })
  email: string;

  @Column({ name: 'email_verified_at', nullable: true })
  emailVerifiedAt: Date;

  @Column({ name: 'phone_number', nullable: true, unique: true })
  phoneNumber: string;

  @Column({ name: 'area_code', nullable: true })
  areaCode: string;

  @Column({ name: 'phone_verified_at', nullable: true })
  phoneVerifiedAt: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  lastname?: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true, type: 'text' })
  bio?: string;
}
