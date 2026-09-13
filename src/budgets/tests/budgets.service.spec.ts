import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BudgetsService } from '../services/budgets.service';
import { Budget } from '../entities/budget.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { Expense } from '../../expenses/entities/expense.entity';

const USER_ID = 'user-1';

type MockRepo = {
  find: jest.Mock;
  findOne: jest.Mock;
  findOneOrFail: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  remove: jest.Mock;
  createQueryBuilder: jest.Mock;
};

const makeRepo = (): MockRepo => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  create: jest.fn((x) => x),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const sampleBudget = (over: Partial<Budget> = {}): Budget =>
  ({
    id: 'budget-1',
    userId: USER_ID,
    tagId: 'tag-1',
    amount: 300,
    tag: { id: 'tag-1', name: 'food', color: '#EF4444' } as Tag,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    deleted_at: null,
    ...over,
  }) as Budget;

const makeQueryBuilder = (rows: Array<{ tag_id: string; total: string }>) => {
  const qb: any = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rows),
  };
  return qb;
};

describe('BudgetsService', () => {
  let service: BudgetsService;
  let budgetRepo: MockRepo;
  let tagRepo: MockRepo;
  let expenseRepo: MockRepo;

  beforeEach(async () => {
    budgetRepo = makeRepo();
    tagRepo = makeRepo();
    expenseRepo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        { provide: getRepositoryToken(Budget), useValue: budgetRepo },
        { provide: getRepositoryToken(Tag), useValue: tagRepo },
        { provide: getRepositoryToken(Expense), useValue: expenseRepo },
      ],
    }).compile();
    service = module.get(BudgetsService);
  });

  describe('getStatus', () => {
    it('filters spending by the requested month when provided', async () => {
      budgetRepo.find.mockResolvedValue([sampleBudget()]);
      const qb = makeQueryBuilder([{ tag_id: 'tag-1', total: '120.00' }]);
      expenseRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getStatus(USER_ID, { month: '2026-05' });

      expect(qb.andWhere).toHaveBeenCalledWith('expense.date >= :startDate', {
        startDate: '2026-05-01',
      });
      expect(qb.andWhere).toHaveBeenCalledWith('expense.date < :endDate', {
        endDate: '2026-06-01',
      });
      expect(result).toEqual([
        {
          tag: { id: 'tag-1', name: 'food', color: '#EF4444' },
          budget: 300,
          spent: 120,
          remaining: 180,
          percentage: 40,
          status: 'normal',
        },
      ]);
    });

    it('defaults to the current month when none is provided', async () => {
      budgetRepo.find.mockResolvedValue([sampleBudget()]);
      const qb = makeQueryBuilder([]);
      expenseRepo.createQueryBuilder.mockReturnValue(qb);

      const now = new Date();
      const expectedStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      await service.getStatus(USER_ID, {});

      expect(qb.andWhere).toHaveBeenCalledWith('expense.date >= :startDate', {
        startDate: expectedStart,
      });
    });

    it('returns an empty array without querying spending when there are no budgets', async () => {
      budgetRepo.find.mockResolvedValue([]);
      const result = await service.getStatus(USER_ID, { month: '2026-05' });
      expect(result).toEqual([]);
      expect(expenseRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });
});
