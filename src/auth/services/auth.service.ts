import { Injectable, Inject } from '@nestjs/common';
import {
  AuthService as DoorkeeperAuthService,
  SessionService,
  DeviceInfo,
} from '@lgerma/nestjs-doorkeeper';
import { ITokenPair } from '../interfaces/auth.interface';
import { UserService } from '../../users/services/user.service';
import { TagsService } from '../../tags/services/tags.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DoorkeeperAuthService)
    private readonly doorkeeperAuth: DoorkeeperAuthService,
    @Inject(SessionService)
    private readonly sessionService: SessionService,
    @Inject(UserService)
    private readonly userService: UserService,
    @Inject(TagsService)
    private readonly tagsService: TagsService,
  ) {}

  async register(
    email: string,
    password: string,
    device: DeviceInfo = {} as DeviceInfo,
  ): Promise<ITokenPair> {
    const tokenPair = await this.doorkeeperAuth.register(email, password, device);
    const { sub } = JSON.parse(
      Buffer.from(tokenPair.accessToken.split('.')[1], 'base64url').toString('utf-8'),
    ) as { sub: string };
    await this.userService.create(sub, email);
    await this.tagsService.seedStarterTags(sub);
    return tokenPair;
  }

  async login(
    email: string,
    password: string,
    device: DeviceInfo = {} as DeviceInfo,
  ): Promise<ITokenPair> {
    return this.doorkeeperAuth.login(email, password, device);
  }

  async refresh(
    refreshToken: string,
    device: DeviceInfo = {} as DeviceInfo,
  ): Promise<ITokenPair> {
    return this.sessionService.rotateSession(refreshToken, device);
  }

  async logout(accessToken: string): Promise<void> {
    return this.doorkeeperAuth.logout(accessToken);
  }

  async logoutAll(userId: string): Promise<void> {
    return this.doorkeeperAuth.logoutAll(userId);
  }
}
