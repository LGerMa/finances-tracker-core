import { registerAs } from '@nestjs/config';

export default registerAs('config', () => {
  return {
    database: {
      database: process.env.DB_DATABASE,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      host: process.env.DB_HOST,
      typeDb: process.env.DB_TYPE || 'postgres',
    },
    internal: {},
    external: {},
    general: {
      auth: {
        token: process.env.JWT_SECRET || 'some-token',
      },
    },
  };
});
