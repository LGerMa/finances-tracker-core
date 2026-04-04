import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import config from './config';
import { AuthModule as AuthKeeperModule, JwtAuthGuard } from '@lgerma/nestjs-doorkeeper';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { TagsModule } from './tags/tags.module';
import { ExpensesModule } from './expenses/expenses.module';

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
    UserModule,
    TagsModule,
    ExpensesModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
