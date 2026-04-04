import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@lgerma/nestjs-doorkeeper';
import { UserService } from '../services/user.service';
import { UpdateMeDto } from '../dtos/update-me.dto';
import { UserProfileResponse } from '../dtos/user-profile.response';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ type: UserProfileResponse })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  getMe(@CurrentUser() user): Promise<UserProfileResponse> {
    return this.userService.getMe(user.id);
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({ type: UserProfileResponse })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  updateMe(
    @CurrentUser() user,
    @Body() dto: UpdateMeDto,
  ): Promise<UserProfileResponse> {
    return this.userService.updateMe(user.id, dto);
  }
}
