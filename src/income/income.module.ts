import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Income } from './entities/income.entity';
import { Tag } from '../tags/entities/tag.entity';
import { IncomeService } from './services/income.service';
import { IncomeController } from './controllers/income.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Income, Tag])],
  providers: [IncomeService],
  controllers: [IncomeController],
  exports: [IncomeService],
})
export class IncomeModule {}
