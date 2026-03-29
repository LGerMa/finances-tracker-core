import { Injectable, Inject } from '@nestjs/common';
import {
  AuthService as DoorkeeperAuthService,
  SessionService,
} from '@lgerma/nestjs-doorkeeper';

export interface DeviceInfo {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DoorkeeperAuthService)
    private readonly doorkeeperAuth: DoorkeeperAuthService,
    @Inject(SessionService)
    private readonly sessionService: SessionService,
  ) {}

  async register(email: string, password: string, device: DeviceInfo = {}) {
    return this.doorkeeperAuth.register(email, password, device);
  }

  async login(email: string, password: string, device: DeviceInfo = {}) {
    return this.doorkeeperAuth.login(email, password, device);
  }

  async refresh(refreshToken: string, device: DeviceInfo = {}) {
    return this.sessionService.rotateSession(refreshToken, device);
  }

  async logout(accessToken: string) {
    return this.doorkeeperAuth.logout(accessToken);
  }

  async logoutAll(userId: string) {
    return this.doorkeeperAuth.logoutAll(userId);
  }
}
