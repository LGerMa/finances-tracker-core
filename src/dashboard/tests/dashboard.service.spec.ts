import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Expense } from '../../expenses/entities/expense.entity';
import { Income } from '../../income/entities/income.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { DashboardService } from '../services/dashboard.service';

const USER_ID = 'user-1';

// budgetRule() issues two raw queries via repository.query():
//   1) expenses grouped by type  -> [{ type, total }]
//   2) income sum                -> [{ total, count }]
// We stub expenseRepository.query to return the grouped rows and
// incomeRepository.query to return the income total.
const makeRepos = (
  typeRows: Array<{ type: string; total: string }>,
  incomeTotal: string,
) => {
  const expenseRepository = { query: jest.fn(async () => typeRows) };
  const incomeRepository = {
    query: jest.fn(async () => [{ total: incomeTotal, count: '1' }]),
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
