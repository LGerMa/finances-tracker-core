import { Global, Module } from '@nestjs/common';

import config from '../config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigType } from '@nestjs/config';
@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigType<typeof config>) => {
        const { host, database, password, port, username } =
          configService.database;
        return {
          type: 'postgres',
          host,
          port,
          database,
          password,
          username,
          synchronize: false,
          logging: false,
          autoLoadEntities: true,
        };
      },
      inject: [config.KEY],
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
