import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import config from './config';
import {
  AuthModule as AuthKeeperModule,
  JwtAuthGuard,
} from '@lgerma/nestjs-doorkeeper';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { TagsModule } from './tags/tags.module';
import { PaymentSourcesModule } from './payment-sources/payment-sources.module';
import { ExpensesModule } from './expenses/expenses.module';
import { IncomeModule } from './income/income.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { BudgetsModule } from './budgets/budgets.module';
import { RecurringModule } from './recurring/recurring.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    ScheduleModule.forRoot(),
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
    PaymentSourcesModule,
    ExpensesModule,
    IncomeModule,
    DashboardModule,
    BudgetsModule,
    RecurringModule,
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
