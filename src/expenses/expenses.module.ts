import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from './entities/expense.entity';
import { Tag } from '../tags/entities/tag.entity';
import { PaymentSourcesModule } from '../payment-sources/payment-sources.module';
import { ExpensesService } from './services/expenses.service';
import { ExpensesController } from './controllers/expenses.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, Tag]), PaymentSourcesModule],
  providers: [ExpensesService],
  controllers: [ExpensesController],
  exports: [ExpensesService],
})
export class ExpensesModule {}
