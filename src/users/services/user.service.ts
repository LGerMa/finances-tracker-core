import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateMeDto } from '../dtos/update-me.dto';
import { IUserProfile } from '../interfaces/user-profile.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getMe(userId: string): Promise<IUserProfile> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.toProfile(user);
  }

  async create(id: string, email: string): Promise<void> {
    const user = this.userRepository.create({ id, email });
    await this.userRepository.save(user);
  }

  async updateMe(userId: string, dto: UpdateMeDto): Promise<IUserProfile> {
    await this.userRepository.update(userId, dto);
    return this.getMe(userId);
  }

  private toProfile(user: User): IUserProfile {
    return {
      id: user.id,
      email: user.email,
      emailVerified: !!user.emailVerifiedAt,
      profile: {
        name: user.name ?? null,
        lastname: user.lastname ?? null,
        phoneNumber: user.phoneNumber ?? null,
        phoneVerified: !!user.phoneVerifiedAt,
        avatarUrl: user.avatarUrl ?? null,
        bio: user.bio ?? null,
      },
      createdAt: user.created_at,
    };
  }
}
