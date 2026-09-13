import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { Budget } from '../budgets/entities/budget.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { TagsService } from './services/tags.service';
import { TagsController } from './controllers/tags.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tag, Budget, Expense])],
  providers: [TagsService],
  controllers: [TagsController],
  exports: [TagsService],
})
export class TagsModule {}
