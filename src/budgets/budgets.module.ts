import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Budget } from './entities/budget.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { BudgetsService } from './services/budgets.service';
import { BudgetsController } from './controllers/budgets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Budget, Tag, Expense])],
  providers: [BudgetsService],
  controllers: [BudgetsController],
  exports: [BudgetsService],
})
export class BudgetsModule {}
