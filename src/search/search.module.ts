import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from '../expenses/entities/expense.entity';
import { Income } from '../income/entities/income.entity';
import { Tag } from '../tags/entities/tag.entity';
import { SearchService } from './services/search.service';
import { SearchController } from './controllers/search.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, Income, Tag])],
  providers: [SearchService],
  controllers: [SearchController],
})
export class SearchModule {}
