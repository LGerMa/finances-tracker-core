import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../../expenses/entities/expense.entity';
import { Income } from '../../income/entities/income.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { PageMetaDto } from '../../common/dtos/page-meta.dto';
import { PageOptionsDto } from '../../common/dtos/page-options.dto';
import { IExpense } from '../../expenses/interfaces/expense.interface';
import {
  BudgetRuleQueryDto,
  BudgetRuleTransactionsQueryDto,
  ByTagsQueryDto,
  CompareTagsQueryDto,
  SummaryQueryDto,
  TrendsQueryDto,
} from '../dtos/dashboard-query.dto';
import {
  ICompareTags,
  ICompareTagItem,
  IBudgetRuleTransactions,
  IDashboardSummary,
  ITagBreakdownItem,
  ITrendItem,
  IBudgetRule,
  IBudgetRuleBreakdown,
  IBudgetRuleBucket,
  RuleBucketName,
  RuleStatusLevel,
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

  async summary(
    userId: string,
    queryDto: SummaryQueryDto,
  ): Promise<IDashboardSummary> {
    const month = queryDto.month ?? this.currentMonth();
    const { startDate, endDate } = this.monthToDateRange(month);

    const expenseResult = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('COALESCE(SUM(expense.amount), 0)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('expense.userId = :userId', { userId })
      .andWhere('expense.date >= :startDate', { startDate })
      .andWhere('expense.date < :endDate', { endDate })
      .getRawOne<{ total: string; count: string }>();

    const incomeResult = await this.incomeRepository
      .createQueryBuilder('income')
      .select('COALESCE(SUM(income.amount), 0)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('income.userId = :userId', { userId })
      .andWhere('income.date >= :startDate', { startDate })
      .andWhere('income.date < :endDate', { endDate })
      .getRawOne<{ total: string; count: string }>();

    const totalExpenses = parseFloat(expenseResult!.total);
    const totalIncome = parseFloat(incomeResult!.total);

    return {
      month,
      totalIncome,
      totalExpenses,
      balance: Math.round((totalIncome - totalExpenses) * 100) / 100,
      expenseCount: parseInt(expenseResult!.count, 10),
      incomeCount: parseInt(incomeResult!.count, 10),
    };
  }

  async budgetRule(
    userId: string,
    queryDto: BudgetRuleQueryDto,
  ): Promise<IBudgetRule> {
    const month = queryDto.month ?? this.currentMonth();
    const { startDate, endDate } = this.monthToDateRange(month);

    const typeRows = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('expense.type', 'type')
      .addSelect('COALESCE(SUM(expense.amount), 0)', 'total')
      .where('expense.userId = :userId', { userId })
      .andWhere('expense.date >= :startDate', { startDate })
      .andWhere('expense.date < :endDate', { endDate })
      .groupBy('expense.type')
      .getRawMany<{ type: string; total: string }>();

    const incomeResult = await this.incomeRepository
      .createQueryBuilder('income')
      .select('COALESCE(SUM(income.amount), 0)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('income.userId = :userId', { userId })
      .andWhere('income.date >= :startDate', { startDate })
      .andWhere('income.date < :endDate', { endDate })
      .getRawOne<{ total: string; count: string }>();

    const round2 = (n: number) => Math.round(n * 100) / 100;

    const breakdown: IBudgetRuleBreakdown = {
      fixed: 0,
      variable: 0,
      unplanned: 0,
      planned: 0,
      saving: 0,
    };
    for (const row of typeRows) {
      if (row.type in breakdown) {
        breakdown[row.type as keyof IBudgetRuleBreakdown] = round2(
          parseFloat(row.total),
        );
      }
    }

    const income = round2(parseFloat(incomeResult!.total));

    const spentByBucket: Record<RuleBucketName, number> = {
      needs: round2(breakdown.fixed + breakdown.variable),
      wants: round2(breakdown.planned),
      savings: round2(breakdown.saving - breakdown.unplanned),
    };

    const targetPctByBucket: Record<RuleBucketName, number> = {
      needs: 50,
      wants: 30,
      savings: 20,
    };

    const rule: IBudgetRuleBucket[] = (
      ['needs', 'wants', 'savings'] as RuleBucketName[]
    ).map((bucket) => {
      const targetPct = targetPctByBucket[bucket];
      const spent = spentByBucket[bucket];
      const target = round2((income * targetPct) / 100);
      const percentage =
        income > 0 && target > 0 ? Math.round((spent / target) * 100) : 0;
      const status: RuleStatusLevel =
        percentage >= 100 ? 'over' : percentage >= 75 ? 'warning' : 'normal';
      return { bucket, spent, target, targetPct, percentage, status };
    });

    return { month, income, breakdown, rule };
  }

  private static readonly BUCKET_TYPES: Record<RuleBucketName, string[]> = {
    needs: ['fixed', 'variable'],
    wants: ['planned'],
    savings: ['saving', 'unplanned'],
  };

  async budgetRuleTransactions(
    userId: string,
    queryDto: BudgetRuleTransactionsQueryDto,
  ): Promise<IBudgetRuleTransactions> {
    const month = queryDto.month ?? this.currentMonth();
    const { startDate, endDate } = this.monthToDateRange(month);
    const types = DashboardService.BUCKET_TYPES[queryDto.bucket];

    const page = queryDto.page ?? 1;
    const take = queryDto.take ?? 10;
    const pageOptionsDto = new PageOptionsDto(page, take);

    const qb = this.expenseRepository
      .createQueryBuilder('expense')
      .where('expense.userId = :userId', { userId })
      .andWhere('expense.date >= :startDate', { startDate })
      .andWhere('expense.date < :endDate', { endDate })
      .andWhere('expense.type IN (:...types)', { types });

    const itemCount = await qb.getCount();

    const rows = await qb
      .leftJoinAndSelect('expense.tags', 'tag')
      .leftJoinAndSelect('expense.paymentSource', 'paymentSource')
      .orderBy('expense.date', 'DESC')
      .addOrderBy('expense.created_at', 'DESC')
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take)
      .getMany();

    const meta = new PageMetaDto({ pageOptionsDto, itemCount });

    return {
      bucket: queryDto.bucket,
      month,
      items: rows.map((e) => this.toExpense(e)),
      meta: {
        page: meta.page,
        take: meta.take,
        itemCount: meta.itemCount,
        pageCount: meta.pageCount,
        hasPreviousPage: meta.hasPreviousPage,
        hasNextPage: meta.hasNextPage,
      },
    };
  }

  private toExpense(expense: Expense): IExpense {
    return {
      id: expense.id,
      amount: parseFloat(expense.amount as any),
      paymentMethod: expense.paymentMethod,
      type: expense.type,
      description: expense.description,
      date: expense.date,
      source: expense.source,
      receiptUrl: expense.receiptUrl,
      tags: (expense.tags ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
      })),
      paymentSource: expense.paymentSource
        ? {
            id: expense.paymentSource.id,
            alias: expense.paymentSource.alias,
            color: expense.paymentSource.color,
          }
        : null,
      createdAt: expense.created_at,
    };
  }

  async byTags(
    userId: string,
    queryDto: ByTagsQueryDto,
  ): Promise<ITagBreakdownItem[]> {
    const month = queryDto.month ?? this.currentMonth();
    const type = queryDto.type ?? 'expense';
    const { startDate, endDate } = this.monthToDateRange(month);

    type Row = {
      id: string;
      name: string;
      color: string;
      total: string;
      count: string;
    };
    type UntaggedRow = { total: string; count: string };

    let taggedRows: Row[];
    let untaggedRow: UntaggedRow | undefined;

    if (type === 'expense') {
      taggedRows = await this.expenseRepository
        .createQueryBuilder('e')
        .innerJoin('e.tags', 't')
        .select('t.id', 'id')
        .addSelect('t.name', 'name')
        .addSelect('t.color', 'color')
        .addSelect('COALESCE(SUM(e.amount), 0)', 'total')
        .addSelect('COUNT(e.id)', 'count')
        .where('e.userId = :userId', { userId })
        .andWhere('e.date >= :startDate', { startDate })
        .andWhere('e.date < :endDate', { endDate })
        .groupBy('t.id')
        .addGroupBy('t.name')
        .addGroupBy('t.color')
        .orderBy('total', 'DESC')
        .getRawMany<Row>();

      untaggedRow = await this.expenseRepository
        .createQueryBuilder('e')
        .leftJoin('e.tags', 't')
        .select('COALESCE(SUM(e.amount), 0)', 'total')
        .addSelect('COUNT(e.id)', 'count')
        .where('e.userId = :userId', { userId })
        .andWhere('e.date >= :startDate', { startDate })
        .andWhere('e.date < :endDate', { endDate })
        .andWhere('t.id IS NULL')
        .getRawOne<UntaggedRow>();
    } else {
      taggedRows = await this.incomeRepository
        .createQueryBuilder('e')
        .innerJoin('e.tags', 't')
        .select('t.id', 'id')
        .addSelect('t.name', 'name')
        .addSelect('t.color', 'color')
        .addSelect('COALESCE(SUM(e.amount), 0)', 'total')
        .addSelect('COUNT(e.id)', 'count')
        .where('e.userId = :userId', { userId })
        .andWhere('e.date >= :startDate', { startDate })
        .andWhere('e.date < :endDate', { endDate })
        .groupBy('t.id')
        .addGroupBy('t.name')
        .addGroupBy('t.color')
        .orderBy('total', 'DESC')
        .getRawMany<Row>();

      untaggedRow = await this.incomeRepository
        .createQueryBuilder('e')
        .leftJoin('e.tags', 't')
        .select('COALESCE(SUM(e.amount), 0)', 'total')
        .addSelect('COUNT(e.id)', 'count')
        .where('e.userId = :userId', { userId })
        .andWhere('e.date >= :startDate', { startDate })
        .andWhere('e.date < :endDate', { endDate })
        .andWhere('t.id IS NULL')
        .getRawOne<UntaggedRow>();
    }

    const result: ITagBreakdownItem[] = taggedRows.map((row) => ({
      tag: { id: row.id, name: row.name, color: row.color },
      total: parseFloat(row.total),
      count: parseInt(row.count, 10),
    }));

    const untaggedCount = parseInt(untaggedRow!.count, 10);
    if (untaggedCount > 0) {
      result.push({
        untagged: true,
        total: parseFloat(untaggedRow!.total),
        count: untaggedCount,
      });
    }

    return result;
  }

  async compareTags(
    userId: string,
    queryDto: CompareTagsQueryDto,
  ): Promise<ICompareTags> {
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

    const tags = await this.tagRepository
      .createQueryBuilder('tag')
      .where('tag.userId = :userId AND tag.name IN (:...tagNames)', {
        userId,
        tagNames,
      })
      .getMany();

    const foundNames = tags.map((t) => t.name);
    const missing = tagNames.filter((n) => !foundNames.includes(n));
    if (missing.length > 0) {
      throw new BadRequestException(`Tags not found: ${missing.join(', ')}`);
    }

    const tagItems: ICompareTagItem[] = [];

    for (const tag of tags) {
      const qb =
        type === 'expense'
          ? this.expenseRepository.createQueryBuilder('e')
          : this.incomeRepository.createQueryBuilder('e');

      const rows = await qb
        .innerJoin('e.tags', 't')
        .select("TO_CHAR(e.date, 'YYYY-MM')", 'month')
        .addSelect('COALESCE(SUM(e.amount), 0)', 'total')
        .where('e.userId = :userId', { userId })
        .andWhere('t.id = :tagId', { tagId: tag.id })
        .andWhere('e.date >= :startDate', { startDate })
        .groupBy("TO_CHAR(e.date, 'YYYY-MM')")
        .orderBy('month', 'DESC')
        .getRawMany<{ month: string; total: string }>();

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

  async trends(
    userId: string,
    queryDto: TrendsQueryDto,
  ): Promise<ITrendItem[]> {
    const months = queryDto.months ?? 6;
    const { startDate } = this.nMonthsAgo(months);

    const expenseRows = await this.expenseRepository
      .createQueryBuilder('expense')
      .select("TO_CHAR(expense.date, 'YYYY-MM')", 'month')
      .addSelect('COALESCE(SUM(expense.amount), 0)', 'total')
      .where('expense.userId = :userId', { userId })
      .andWhere('expense.date >= :startDate', { startDate })
      .groupBy("TO_CHAR(expense.date, 'YYYY-MM')")
      .orderBy('month', 'DESC')
      .getRawMany<{ month: string; total: string }>();

    const incomeRows = await this.incomeRepository
      .createQueryBuilder('income')
      .select("TO_CHAR(income.date, 'YYYY-MM')", 'month')
      .addSelect('COALESCE(SUM(income.amount), 0)', 'total')
      .where('income.userId = :userId', { userId })
      .andWhere('income.date >= :startDate', { startDate })
      .groupBy("TO_CHAR(income.date, 'YYYY-MM')")
      .orderBy('month', 'DESC')
      .getRawMany<{ month: string; total: string }>();

    const monthMap = new Map<
      string,
      { totalIncome: number; totalExpenses: number }
    >();

    for (const row of expenseRows) {
      monthMap.set(row.month, {
        totalIncome: 0,
        totalExpenses: parseFloat(row.total),
      });
    }
    for (const row of incomeRows) {
      const existing = monthMap.get(row.month) ?? {
        totalIncome: 0,
        totalExpenses: 0,
      };
      monthMap.set(row.month, {
        ...existing,
        totalIncome: parseFloat(row.total),
      });
    }

    return Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }

  private currentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private monthToDateRange(month: string): {
    startDate: string;
    endDate: string;
  } {
    const [year, mon] = month.split('-').map(Number);
    const start = new Date(Date.UTC(year, mon - 1, 1));
    const end = new Date(Date.UTC(year, mon, 1));
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  }

  private nMonthsAgo(n: number): {
    fromMonth: string;
    toMonth: string;
    startDate: string;
  } {
    const now = new Date();
    const toMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const from = new Date(
      Date.UTC(now.getFullYear(), now.getMonth() - (n - 1), 1),
    );
    const fromMonth = `${from.getUTCFullYear()}-${String(from.getUTCMonth() + 1).padStart(2, '0')}`;
    return {
      fromMonth,
      toMonth,
      startDate: from.toISOString().slice(0, 10),
    };
  }

  private calcTrend(
    monthData: { month: string; total: number }[],
  ): 'up' | 'down' | 'stable' {
    if (monthData.length < 2) return 'stable';
    const sorted = [...monthData].sort((a, b) =>
      b.month.localeCompare(a.month),
    );
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
