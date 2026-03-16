import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import config from './config';
import { AuthModule } from '@lgerma/nestjs-doorkeeper';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    DatabaseModule,
    AuthModule.forRoot({
      jwt: {
        secret: process.env.JWT_SECRET || 'some-token',
      },
      routePrefix: 'auth',
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
