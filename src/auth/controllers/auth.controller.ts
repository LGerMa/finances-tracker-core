import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public, CurrentUser, deviceFrom } from '@lgerma/nestjs-doorkeeper';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { RefreshDto } from '../dtos/refresh.dto';
import { TokenPairResponse } from '../dtos/token-pair.response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ type: TokenPairResponse })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
  ): Promise<TokenPairResponse> {
    return this.authService.register(dto.email, dto.password, deviceFrom(req as any));
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ type: TokenPairResponse })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(
    @Body() dto: LoginDto,
    @Req() req: Request,
  ): Promise<TokenPairResponse> {
    return this.authService.login(dto.email, dto.password, deviceFrom(req as any));
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate access and refresh tokens' })
  @ApiOkResponse({ type: TokenPairResponse })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
  ): Promise<TokenPairResponse> {
    return this.authService.refresh(dto.refreshToken, deviceFrom(req as any));
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout from current session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  logout(@Req() req: Request & { accessToken: string }): Promise<void> {
    return this.authService.logout(req.accessToken);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({ status: 200, description: 'Logged out from all sessions' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  logoutAll(@CurrentUser() user: { id: string }): Promise<void> {
    return this.authService.logoutAll(user.id);
  }
}
