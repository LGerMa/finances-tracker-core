import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Expense } from '../../expenses/entities/expense.entity';
import { Income } from '../../income/entities/income.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { DashboardService } from '../services/dashboard.service';

const USER_ID = 'user-1';

// budgetRule() issues two query-builder aggregate queries:
//   1) expenses grouped by type  -> getRawMany() => [{ type, total }]
//   2) income sum                -> getRawOne()  => { total, count }
// We stub each repository's createQueryBuilder to return a chainable
// mock whose getRawMany/getRawOne resolve to the given rows.
const makeQb = (raw: unknown) => {
  const qb: any = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(async () => raw),
    getRawOne: jest.fn(async () => raw),
  };
  return qb;
};

const makeRepos = (
  typeRows: Array<{ type: string; total: string }>,
  incomeTotal: string,
) => {
  const expenseRepository = {
    createQueryBuilder: jest.fn(() => makeQb(typeRows)),
  };
  const incomeRepository = {
    createQueryBuilder: jest.fn(() =>
      makeQb({ total: incomeTotal, count: '1' }),
    ),
  };
  const tagRepository = {};
  return { expenseRepository, incomeRepository, tagRepository };
};

const build = async (repos: ReturnType<typeof makeRepos>) => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      DashboardService,
      {
        provide: getRepositoryToken(Expense),
        useValue: repos.expenseRepository,
      },
      { provide: getRepositoryToken(Income), useValue: repos.incomeRepository },
      { provide: getRepositoryToken(Tag), useValue: repos.tagRepository },
    ],
  }).compile();
  return module.get(DashboardService);
};

const bucket = (rule: any[], name: string) =>
  rule.find((b) => b.bucket === name);

describe('DashboardService.budgetRule', () => {
  it('maps fixed+variable to needs and planned to wants', async () => {
    const repos = makeRepos(
      [
        { type: 'fixed', total: '700' },
        { type: 'variable', total: '450' },
        { type: 'planned', total: '300' },
      ],
      '2000',
    );
    const service = await build(repos);
    const res = await service.budgetRule(USER_ID, { month: '2026-09' });

    expect(bucket(res.rule, 'needs').spent).toBe(1150);
    expect(bucket(res.rule, 'wants').spent).toBe(300);
  });

  it('deducts unplanned from saving in the savings bucket', async () => {
    const repos = makeRepos(
      [
        { type: 'saving', total: '200' },
        { type: 'unplanned', total: '100' },
      ],
      '2000',
    );
    const service = await build(repos);
    const res = await service.budgetRule(USER_ID, { month: '2026-09' });

    expect(bucket(res.rule, 'savings').spent).toBe(100);
  });

  it('allows negative savings when unplanned exceeds contributions', async () => {
    const repos = makeRepos([{ type: 'unplanned', total: '300' }], '2000');
    const service = await build(repos);
    const res = await service.budgetRule(USER_ID, { month: '2026-09' });

    const savings = bucket(res.rule, 'savings');
    expect(savings.spent).toBe(-300);
    expect(savings.status).toBe('normal');
  });

  it('returns all five breakdown keys even when types are absent', async () => {
    const repos = makeRepos([{ type: 'fixed', total: '100' }], '1000');
    const service = await build(repos);
    const res = await service.budgetRule(USER_ID, { month: '2026-09' });

    expect(res.breakdown).toEqual({
      fixed: 100,
      variable: 0,
      unplanned: 0,
      planned: 0,
      saving: 0,
    });
  });

  it('computes status from percentage of the bucket target (75 / 100 thresholds)', async () => {
    // income 1000 -> needs target 500. spend 375 -> 75% -> warning.
    const warn = await build(
      makeRepos([{ type: 'fixed', total: '375' }], '1000'),
    );
    expect(
      bucket(
        (await warn.budgetRule(USER_ID, { month: '2026-09' })).rule,
        'needs',
      ).status,
    ).toBe('warning');

    // spend 370 -> 74% -> normal.
    const normal = await build(
      makeRepos([{ type: 'fixed', total: '370' }], '1000'),
    );
    expect(
      bucket(
        (await normal.budgetRule(USER_ID, { month: '2026-09' })).rule,
        'needs',
      ).status,
    ).toBe('normal');

    // spend 500 -> 100% -> over.
    const over = await build(
      makeRepos([{ type: 'fixed', total: '500' }], '1000'),
    );
    expect(
      bucket(
        (await over.budgetRule(USER_ID, { month: '2026-09' })).rule,
        'needs',
      ).status,
    ).toBe('over');
  });

  it('handles zero income without dividing: target 0, percentage 0, status normal', async () => {
    const repos = makeRepos([{ type: 'fixed', total: '100' }], '0');
    const service = await build(repos);
    const res = await service.budgetRule(USER_ID, { month: '2026-09' });

    for (const b of res.rule) {
      expect(b.target).toBe(0);
      expect(b.percentage).toBe(0);
      expect(b.status).toBe('normal');
    }
  });

  it('defaults month to the current month when omitted', async () => {
    const repos = makeRepos([], '1000');
    const service = await build(repos);
    const res = await service.budgetRule(USER_ID, {});
    expect(res.month).toMatch(/^\d{4}-\d{2}$/);
  });
});

describe('DashboardService.budgetRuleTransactions', () => {
  const makeQbRepo = (items: any[], itemCount: number) => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn(async () => itemCount),
      getMany: jest.fn(async () => items),
    };
    const expenseRepository = {
      createQueryBuilder: jest.fn(() => qb),
    };
    return { expenseRepository, qb };
  };

  const buildWithQb = async (expenseRepository: any) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(Expense), useValue: expenseRepository },
        { provide: getRepositoryToken(Income), useValue: {} },
        { provide: getRepositoryToken(Tag), useValue: {} },
      ],
    }).compile();
    return module.get(DashboardService);
  };

  const makeExpenseRow = (type: string) => ({
    id: 'e1',
    amount: '10.00',
    paymentMethod: 'cash',
    type,
    description: null,
    date: '2026-09-05',
    source: 'manual',
    receiptUrl: null,
    tags: [],
    paymentSource: null,
    created_at: new Date('2026-09-05'),
  });

  it('filters by type IN (fixed, variable) for the needs bucket', async () => {
    const { expenseRepository, qb } = makeQbRepo(
      [makeExpenseRow('fixed'), makeExpenseRow('variable')],
      2,
    );
    const service = await buildWithQb(expenseRepository);

    const res = await service.budgetRuleTransactions(USER_ID, {
      month: '2026-09',
      bucket: 'needs',
    } as any);

    expect(qb.andWhere).toHaveBeenCalledWith('expense.type IN (:...types)', {
      types: ['fixed', 'variable'],
    });
    expect(res.bucket).toBe('needs');
    expect(res.items).toHaveLength(2);
  });

  it('filters by type = planned for the wants bucket', async () => {
    const { expenseRepository, qb } = makeQbRepo(
      [makeExpenseRow('planned')],
      1,
    );
    const service = await buildWithQb(expenseRepository);

    await service.budgetRuleTransactions(USER_ID, {
      month: '2026-09',
      bucket: 'wants',
    } as any);

    expect(qb.andWhere).toHaveBeenCalledWith('expense.type IN (:...types)', {
      types: ['planned'],
    });
  });

  it('filters by type IN (saving, unplanned) for the savings bucket, undifferentiated by sign', async () => {
    const { expenseRepository, qb } = makeQbRepo(
      [makeExpenseRow('saving'), makeExpenseRow('unplanned')],
      2,
    );
    const service = await buildWithQb(expenseRepository);

    const res = await service.budgetRuleTransactions(USER_ID, {
      month: '2026-09',
      bucket: 'savings',
    } as any);

    expect(qb.andWhere).toHaveBeenCalledWith('expense.type IN (:...types)', {
      types: ['saving', 'unplanned'],
    });
    expect(res.items.map((i) => i.type)).toEqual(['saving', 'unplanned']);
  });

  it('paginates using PageOptionsDto/PageMetaDto conventions', async () => {
    const { expenseRepository, qb } = makeQbRepo([makeExpenseRow('fixed')], 21);
    const service = await buildWithQb(expenseRepository);

    const res = await service.budgetRuleTransactions(USER_ID, {
      month: '2026-09',
      bucket: 'needs',
      page: 2,
      take: 10,
    } as any);

    expect(qb.skip).toHaveBeenCalledWith(10);
    expect(qb.take).toHaveBeenCalledWith(10);
    expect(res.meta).toEqual({
      page: 2,
      take: 10,
      itemCount: 21,
      pageCount: 3,
      hasPreviousPage: true,
      hasNextPage: true,
    });
  });

  it('defaults month to the current month when omitted', async () => {
    const { expenseRepository } = makeQbRepo([], 0);
    const service = await buildWithQb(expenseRepository);

    const res = await service.budgetRuleTransactions(USER_ID, {
      bucket: 'needs',
    } as any);

    expect(res.month).toMatch(/^\d{4}-\d{2}$/);
  });
});
