import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../../expenses/entities/expense.entity';
import { Income } from '../../income/entities/income.entity';
import { Tag } from '../../tags/entities/tag.entity';
import {
  ByTagsQueryDto,
  CompareTagsQueryDto,
  SummaryQueryDto,
  TrendsQueryDto,
} from '../dtos/dashboard-query.dto';
import {
  ICompareTags,
  ICompareTagItem,
  IDashboardSummary,
  ITagBreakdownItem,
  ITrendItem,
} from '../interfaces/dashboard.interface';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Income)
    private readonly incomeRepository: Repository<Income>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async summary(userId: string, queryDto: SummaryQueryDto): Promise<IDashboardSummary> {
    const month = queryDto.month ?? this.currentMonth();
    const { startDate, endDate } = this.monthToDateRange(month);

    const [expenseResult] = await this.expenseRepository.query(
      `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
       FROM expenses
       WHERE user_id = $1 AND date >= $2 AND date < $3`,
      [userId, startDate, endDate],
    );

    const [incomeResult] = await this.incomeRepository.query(
      `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
       FROM income
       WHERE user_id = $1 AND date >= $2 AND date < $3`,
      [userId, startDate, endDate],
    );

    const totalExpenses = parseFloat(expenseResult.total);
    const totalIncome = parseFloat(incomeResult.total);

    return {
      month,
      totalIncome,
      totalExpenses,
      balance: Math.round((totalIncome - totalExpenses) * 100) / 100,
      expenseCount: parseInt(expenseResult.count, 10),
      incomeCount: parseInt(incomeResult.count, 10),
    };
  }

  async byTags(userId: string, queryDto: ByTagsQueryDto): Promise<ITagBreakdownItem[]> {
    const month = queryDto.month ?? this.currentMonth();
    const type = queryDto.type ?? 'expense';
    const { startDate, endDate } = this.monthToDateRange(month);

    const table = type === 'expense' ? 'expenses' : 'income';
    const joinTable = type === 'expense' ? 'expense_tags' : 'income_tags';
    const joinColumn = type === 'expense' ? 'expense_id' : 'income_id';
    const repo = type === 'expense' ? this.expenseRepository : this.incomeRepository;

    const taggedRows: Array<{ id: string; name: string; color: string; total: string; count: string }> =
      await repo.query(
        `SELECT t.id, t.name, t.color,
                COALESCE(SUM(e.amount), 0) as total,
                COUNT(e.id) as count
         FROM ${table} e
         INNER JOIN ${joinTable} et ON et.${joinColumn} = e.id
         INNER JOIN tags t ON t.id = et.tag_id
         WHERE e.user_id = $1 AND e.date >= $2 AND e.date < $3
         GROUP BY t.id, t.name, t.color
         ORDER BY total DESC`,
        [userId, startDate, endDate],
      );

    const [untaggedRow]: Array<{ total: string; count: string }> = await repo.query(
      `SELECT COALESCE(SUM(e.amount), 0) as total, COUNT(e.id) as count
       FROM ${table} e
       WHERE e.user_id = $1 AND e.date >= $2 AND e.date < $3
         AND e.id NOT IN (SELECT ${joinColumn} FROM ${joinTable})`,
      [userId, startDate, endDate],
    );

    const result: ITagBreakdownItem[] = taggedRows.map((row) => ({
      tag: { id: row.id, name: row.name, color: row.color },
      total: parseFloat(row.total),
      count: parseInt(row.count, 10),
    }));

    const untaggedCount = parseInt(untaggedRow.count, 10);
    if (untaggedCount > 0) {
      result.push({
        untagged: true,
        total: parseFloat(untaggedRow.total),
        count: untaggedCount,
      });
    }

    return result;
  }

  async compareTags(userId: string, queryDto: CompareTagsQueryDto): Promise<ICompareTags> {
    const tagNames = queryDto.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (tagNames.length < 2 || tagNames.length > 5) {
      throw new BadRequestException('Provide between 2 and 5 tag names');
    }

    const months = queryDto.months ?? 6;
    const type = queryDto.type ?? 'expense';
    const { fromMonth, toMonth, startDate } = this.nMonthsAgo(months);

    const table = type === 'expense' ? 'expenses' : 'income';
    const joinTable = type === 'expense' ? 'expense_tags' : 'income_tags';
    const joinColumn = type === 'expense' ? 'expense_id' : 'income_id';
    const repo = type === 'expense' ? this.expenseRepository : this.incomeRepository;

    const tags = await this.tagRepository
      .createQueryBuilder('tag')
      .where('tag.userId = :userId AND tag.name IN (:...tagNames)', { userId, tagNames })
      .getMany();

    const foundNames = tags.map((t) => t.name);
    const missing = tagNames.filter((n) => !foundNames.includes(n));
    if (missing.length > 0) {
      throw new BadRequestException(`Tags not found: ${missing.join(', ')}`);
    }

    const tagItems: ICompareTagItem[] = [];

    for (const tag of tags) {
      const rows: Array<{ month: string; total: string }> = await repo.query(
        `SELECT TO_CHAR(e.date, 'YYYY-MM') as month,
                COALESCE(SUM(e.amount), 0) as total
         FROM ${table} e
         INNER JOIN ${joinTable} et ON et.${joinColumn} = e.id
         WHERE e.user_id = $1 AND et.tag_id = $2 AND e.date >= $3
         GROUP BY TO_CHAR(e.date, 'YYYY-MM')
         ORDER BY month DESC`,
        [userId, tag.id, startDate],
      );

      const monthData = rows.map((r) => ({
        month: r.month,
        total: parseFloat(r.total),
      }));

      const average =
        monthData.length > 0
          ? monthData.reduce((sum, m) => sum + m.total, 0) / months
          : 0;

      tagItems.push({
        tag: { id: tag.id, name: tag.name, color: tag.color },
        months: monthData,
        average: Math.round(average * 100) / 100,
        trend: this.calcTrend(monthData),
      });
    }

    return {
      period: { from: fromMonth, to: toMonth },
      tags: tagItems,
    };
  }

  async trends(userId: string, queryDto: TrendsQueryDto): Promise<ITrendItem[]> {
    const months = queryDto.months ?? 6;
    const { startDate } = this.nMonthsAgo(months);

    const expenseRows: Array<{ month: string; total: string }> =
      await this.expenseRepository.query(
        `SELECT TO_CHAR(date, 'YYYY-MM') as month, COALESCE(SUM(amount), 0) as total
         FROM expenses
         WHERE user_id = $1 AND date >= $2
         GROUP BY TO_CHAR(date, 'YYYY-MM')
         ORDER BY month DESC`,
        [userId, startDate],
      );

    const incomeRows: Array<{ month: string; total: string }> =
      await this.incomeRepository.query(
        `SELECT TO_CHAR(date, 'YYYY-MM') as month, COALESCE(SUM(amount), 0) as total
         FROM income
         WHERE user_id = $1 AND date >= $2
         GROUP BY TO_CHAR(date, 'YYYY-MM')
         ORDER BY month DESC`,
        [userId, startDate],
      );

    const monthMap = new Map<string, { totalIncome: number; totalExpenses: number }>();

    for (const row of expenseRows) {
      monthMap.set(row.month, { totalIncome: 0, totalExpenses: parseFloat(row.total) });
    }
    for (const row of incomeRows) {
      const existing = monthMap.get(row.month) ?? { totalIncome: 0, totalExpenses: 0 };
      monthMap.set(row.month, { ...existing, totalIncome: parseFloat(row.total) });
    }

    return Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }

  private currentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private monthToDateRange(month: string): { startDate: string; endDate: string } {
    const [year, mon] = month.split('-').map(Number);
    const start = new Date(Date.UTC(year, mon - 1, 1));
    const end = new Date(Date.UTC(year, mon, 1));
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  }

  private nMonthsAgo(n: number): { fromMonth: string; toMonth: string; startDate: string } {
    const now = new Date();
    const toMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const from = new Date(Date.UTC(now.getFullYear(), now.getMonth() - (n - 1), 1));
    const fromMonth = `${from.getUTCFullYear()}-${String(from.getUTCMonth() + 1).padStart(2, '0')}`;
    return {
      fromMonth,
      toMonth,
      startDate: from.toISOString().slice(0, 10),
    };
  }

  private calcTrend(monthData: { month: string; total: number }[]): 'up' | 'down' | 'stable' {
    if (monthData.length < 2) return 'stable';
    const sorted = [...monthData].sort((a, b) => b.month.localeCompare(a.month));
    const half = Math.ceil(sorted.length / 2);
    const recent = sorted.slice(0, half);
    const older = sorted.slice(half);
    const recentAvg = recent.reduce((s, m) => s + m.total, 0) / recent.length;
    const olderAvg = older.reduce((s, m) => s + m.total, 0) / older.length;
    if (olderAvg === 0) return recentAvg > 0 ? 'up' : 'stable';
    const pct = (recentAvg - olderAvg) / olderAvg;
    if (pct > 0.1) return 'up';
    if (pct < -0.1) return 'down';
    return 'stable';
  }
}
