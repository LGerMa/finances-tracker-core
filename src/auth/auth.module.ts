import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { UserModule } from '../users/user.module';
import { TagsModule } from '../tags/tags.module';

@Module({
  imports: [UserModule, TagsModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
