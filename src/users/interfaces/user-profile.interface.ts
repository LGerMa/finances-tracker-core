export interface IUserProfileEmbedded {
  name: string | null;
  lastname: string | null;
  phoneNumber: string | null;
  phoneVerified: boolean;
  avatarUrl: string | null;
  bio: string | null;
}

export interface IUserProfile {
  id: string;
  email: string;
  emailVerified: boolean;
  profile: IUserProfileEmbedded;
  createdAt: Date;
}
