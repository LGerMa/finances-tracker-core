import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SearchService } from '../services/search.service';
import { Expense } from '../../expenses/entities/expense.entity';
import { Income } from '../../income/entities/income.entity';
import { Tag } from '../../tags/entities/tag.entity';

const USER_ID = 'user-1';

const makeQueryBuilder = (rows: any[]) => {
  const qb: any = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(rows),
  };
  return qb;
};

type MockRepo = { createQueryBuilder: jest.Mock };
const makeRepo = (): MockRepo => ({ createQueryBuilder: jest.fn() });

describe('SearchService', () => {
  let service: SearchService;
  let expenseRepo: MockRepo;
  let incomeRepo: MockRepo;
  let tagRepo: MockRepo;

  beforeEach(async () => {
    expenseRepo = makeRepo();
    incomeRepo = makeRepo();
    tagRepo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: getRepositoryToken(Expense), useValue: expenseRepo },
        { provide: getRepositoryToken(Income), useValue: incomeRepo },
        { provide: getRepositoryToken(Tag), useValue: tagRepo },
      ],
    }).compile();
    service = module.get(SearchService);
  });

  describe('search', () => {
    it('returns empty groups without querying when q is empty or whitespace', async () => {
      const result = await service.search(USER_ID, { q: '   ' } as any);
      expect(result).toEqual({ expenses: [], income: [], tags: [] });
      expect(expenseRepo.createQueryBuilder).not.toHaveBeenCalled();
      expect(incomeRepo.createQueryBuilder).not.toHaveBeenCalled();
      expect(tagRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('searches expenses by description, scoped to the user, with the default limit', async () => {
      const qb = makeQueryBuilder([
        {
          id: 'e1',
          description: 'grocery food run',
          amount: '12.50',
          date: '2026-05-03',
          tags: [{ id: 't1', name: 'food', color: '#EF4444', deleted_at: null }],
        },
      ]);
      expenseRepo.createQueryBuilder.mockReturnValue(qb);
      incomeRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder([]));
      tagRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder([]));

      const result = await service.search(USER_ID, { q: 'food' } as any);

      expect(qb.where).toHaveBeenCalledWith('expense.userId = :userId', {
        userId: USER_ID,
      });
      expect(qb.andWhere).toHaveBeenCalledWith(
        'expense.description ILIKE :q',
        { q: '%food%' },
      );
      expect(qb.take).toHaveBeenCalledWith(5);
      expect(result.expenses).toEqual([
        {
          id: 'e1',
          description: 'grocery food run',
          amount: 12.5,
          date: '2026-05-03',
          tags: [{ id: 't1', name: 'food', color: '#EF4444' }],
        },
      ]);
    });

    it('excludes soft-deleted tags from expense/income results', async () => {
      const qb = makeQueryBuilder([
        {
          id: 'e1',
          description: 'food',
          amount: '10',
          date: '2026-05-03',
          tags: [
            { id: 't1', name: 'food', color: '#EF4444', deleted_at: null },
            {
              id: 't2',
              name: 'old-tag',
              color: '#000000',
              deleted_at: new Date('2026-01-01'),
            },
          ],
        },
      ]);
      expenseRepo.createQueryBuilder.mockReturnValue(qb);
      incomeRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder([]));
      tagRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder([]));

      const result = await service.search(USER_ID, { q: 'food' } as any);

      expect(result.expenses[0].tags).toEqual([
        { id: 't1', name: 'food', color: '#EF4444' },
      ]);
    });

    it('applies a custom limit to every group', async () => {
      const qb = makeQueryBuilder([]);
      expenseRepo.createQueryBuilder.mockReturnValue(qb);
      incomeRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder([]));
      tagRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder([]));

      await service.search(USER_ID, { q: 'food', limit: 10 } as any);

      expect(qb.take).toHaveBeenCalledWith(10);
    });

    it('searches tags by name, scoped to the user', async () => {
      expenseRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder([]));
      incomeRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder([]));
      const qb = makeQueryBuilder([
        { id: 't1', name: 'food', color: '#EF4444' },
      ]);
      tagRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.search(USER_ID, { q: 'foo' } as any);

      expect(qb.where).toHaveBeenCalledWith('tag.userId = :userId', {
        userId: USER_ID,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('tag.name ILIKE :q', {
        q: '%foo%',
      });
      expect(result.tags).toEqual([{ id: 't1', name: 'food', color: '#EF4444' }]);
    });
  });
});
