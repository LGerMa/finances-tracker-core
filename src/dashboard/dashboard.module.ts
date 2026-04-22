import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from '../expenses/entities/expense.entity';
import { Income } from '../income/entities/income.entity';
import { Tag } from '../tags/entities/tag.entity';
import { DashboardService } from './services/dashboard.service';
import { DashboardController } from './controllers/dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, Income, Tag])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
