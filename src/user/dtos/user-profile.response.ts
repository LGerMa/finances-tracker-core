import { ApiProperty } from '@nestjs/swagger';
import { IUserProfile, IUserProfileEmbedded } from '../interfaces/user-profile.interface';

export class UserProfileEmbedded implements IUserProfileEmbedded {
  @ApiProperty({ nullable: true })
  name: string | null;

  @ApiProperty({ nullable: true })
  lastname: string | null;

  @ApiProperty({ nullable: true })
  phoneNumber: string | null;

  @ApiProperty()
  phoneVerified: boolean;

  @ApiProperty({ nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ nullable: true })
  bio: string | null;
}

export class UserProfileResponse implements IUserProfile {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty({ type: () => UserProfileEmbedded })
  profile: UserProfileEmbedded;

  @ApiProperty()
  createdAt: Date;
}
