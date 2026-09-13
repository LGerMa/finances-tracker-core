import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../../expenses/entities/expense.entity';
import { Income } from '../../income/entities/income.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { SearchQueryDto } from '../dtos/search-query.dto';
import {
  ISearchExpenseItem,
  ISearchIncomeItem,
  ISearchResult,
  ISearchTag,
  ISearchTagItem,
} from '../interfaces/search.interface';

const DEFAULT_LIMIT = 5;

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Income)
    private readonly incomeRepository: Repository<Income>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async search(
    userId: string,
    queryDto: SearchQueryDto,
  ): Promise<ISearchResult> {
    const q = queryDto.q?.trim();
    if (!q) return { expenses: [], income: [], tags: [] };

    const limit = queryDto.limit ?? DEFAULT_LIMIT;

    const [expenses, income, tags] = await Promise.all([
      this.searchExpenses(userId, q, limit),
      this.searchIncome(userId, q, limit),
      this.searchTags(userId, q, limit),
    ]);

    return { expenses, income, tags };
  }

  private async searchExpenses(
    userId: string,
    q: string,
    limit: number,
  ): Promise<ISearchExpenseItem[]> {
    const expenses = await this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.tags', 'tag')
      .where('expense.userId = :userId', { userId })
      .andWhere('expense.description ILIKE :q', { q: `%${q}%` })
      .orderBy('expense.date', 'DESC')
      .take(limit)
      .getMany();

    return expenses.map((e) => ({
      id: e.id,
      description: e.description,
      amount: parseFloat(e.amount as any),
      date: e.date,
      tags: this.toTags(e.tags),
    }));
  }

  private async searchIncome(
    userId: string,
    q: string,
    limit: number,
  ): Promise<ISearchIncomeItem[]> {
    const income = await this.incomeRepository
      .createQueryBuilder('income')
      .leftJoinAndSelect('income.tags', 'tag')
      .where('income.userId = :userId', { userId })
      .andWhere('income.description ILIKE :q', { q: `%${q}%` })
      .orderBy('income.date', 'DESC')
      .take(limit)
      .getMany();

    return income.map((i) => ({
      id: i.id,
      description: i.description,
      amount: parseFloat(i.amount as any),
      date: i.date,
      tags: this.toTags(i.tags),
    }));
  }

  private async searchTags(
    userId: string,
    q: string,
    limit: number,
  ): Promise<ISearchTagItem[]> {
    const tags = await this.tagRepository
      .createQueryBuilder('tag')
      .where('tag.userId = :userId', { userId })
      .andWhere('tag.name ILIKE :q', { q: `%${q}%` })
      .orderBy('tag.name', 'ASC')
      .take(limit)
      .getMany();

    return tags.map((t) => ({ id: t.id, name: t.name, color: t.color }));
  }

  private toTags(tags: Tag[] | undefined): ISearchTag[] {
    return (tags ?? [])
      .filter((t) => !t.deleted_at)
      .map((t) => ({ id: t.id, name: t.name, color: t.color }));
  }
}
