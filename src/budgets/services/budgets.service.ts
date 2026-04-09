import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Budget } from '../entities/budget.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { Expense } from '../../expenses/entities/expense.entity';
import { CreateBudgetDto, UpdateBudgetDto } from '../dtos/budget.dto';
import {
  IBudget,
  IBudgetStatus,
  IBudgetTag,
  BudgetStatusLevel,
} from '../interfaces/budget.interface';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  async findAll(userId: string): Promise<IBudget[]> {
    const budgets = await this.budgetRepository.find({
      where: { userId },
      order: { created_at: 'ASC' },
    });
    return budgets.map(this.toBudget);
  }

  async create(userId: string, dto: CreateBudgetDto): Promise<IBudget> {
    const tag = await this.tagRepository.findOne({
      where: { id: dto.tagId, userId },
    });
    if (!tag) throw new NotFoundException('Tag not found');

    const budget = this.budgetRepository.create({
      userId,
      tagId: dto.tagId,
      amount: dto.amount,
    });

    try {
      const saved = await this.budgetRepository.save(budget);
      const loaded = await this.budgetRepository.findOneOrFail({
        where: { id: saved.id },
      });
      return this.toBudget(loaded);
    } catch (e) {
      if (e instanceof QueryFailedError && (e as any).code === '23505') {
        throw new ConflictException('A budget for this tag already exists');
      }
      throw e;
    }
  }

  async update(
    userId: string,
    budgetId: string,
    dto: UpdateBudgetDto,
  ): Promise<IBudget> {
    const budget = await this.findOwned(userId, budgetId);
    budget.amount = dto.amount;
    const saved = await this.budgetRepository.save(budget);
    return this.toBudget(saved);
  }

  async remove(userId: string, budgetId: string): Promise<void> {
    const budget = await this.findOwned(userId, budgetId);
    await this.budgetRepository.remove(budget);
  }

  async getStatus(userId: string): Promise<IBudgetStatus[]> {
    const budgets = await this.budgetRepository.find({
      where: { userId },
    });

    if (!budgets.length) return [];

    const tagIds = budgets.map((b) => b.tagId);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    const spendingRows: Array<{ tag_id: string; total: string }> =
      await this.expenseRepository
        .createQueryBuilder('expense')
        .select('et.tag_id', 'tag_id')
        .addSelect('SUM(expense.amount)', 'total')
        .innerJoin('expense_tags', 'et', 'et.expense_id = expense.id')
        .where('expense.user_id = :userId', { userId })
        .andWhere('expense.date >= :startOfMonth', { startOfMonth })
        .andWhere('expense.date <= :endOfMonth', { endOfMonth })
        .andWhere('et.tag_id IN (:...tagIds)', { tagIds })
        .groupBy('et.tag_id')
        .getRawMany();

    const spendingMap = new Map(
      spendingRows.map((r) => [r.tag_id, parseFloat(r.total)]),
    );

    return budgets.map((budget) => {
      const budgetAmount = Number(budget.amount);
      const spent = spendingMap.get(budget.tagId) ?? 0;
      const remaining = budgetAmount - spent;
      const percentage = Math.round((spent / budgetAmount) * 100);
      const status: BudgetStatusLevel =
        percentage >= 100 ? 'over' : percentage >= 75 ? 'warning' : 'normal';

      return {
        tag: this.toTagItem(budget.tag),
        budget: budgetAmount,
        spent,
        remaining,
        percentage,
        status,
      };
    });
  }

  private async findOwned(userId: string, budgetId: string): Promise<Budget> {
    const budget = await this.budgetRepository.findOne({
      where: { id: budgetId, userId },
    });
    if (!budget) throw new NotFoundException('Budget not found');
    return budget;
  }

  private toTagItem(tag: Tag): IBudgetTag {
    return { id: tag.id, name: tag.name, color: tag.color };
  }

  private toBudget = (budget: Budget): IBudget => ({
    id: budget.id,
    tag: this.toTagItem(budget.tag),
    amount: Number(budget.amount),
    createdAt: budget.created_at,
  });
}
