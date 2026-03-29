import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import config from './config';
import { AuthModule as AuthKeeperModule } from '@lgerma/nestjs-doorkeeper';
import { AuthModule } from './auth/auth.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    DatabaseModule,
    AuthKeeperModule.forRoot({
      jwt: {
        secret: process.env.JWT_SECRET || 'some-token',
      },
      mountController: false,
    }),
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
