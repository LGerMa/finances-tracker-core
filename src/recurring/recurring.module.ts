import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecurringEntry } from './entities/recurring-entry.entity';
import { Tag } from '../tags/entities/tag.entity';
import { RecurringService } from './services/recurring.service';
import { RecurringController } from './controllers/recurring.controller';
import { ExpensesModule } from '../expenses/expenses.module';
import { IncomeModule } from '../income/income.module';
import { PaymentSourcesModule } from '../payment-sources/payment-sources.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecurringEntry, Tag]),
    ExpensesModule,
    IncomeModule,
    PaymentSourcesModule,
  ],
  providers: [RecurringService],
  controllers: [RecurringController],
})
export class RecurringModule {}
