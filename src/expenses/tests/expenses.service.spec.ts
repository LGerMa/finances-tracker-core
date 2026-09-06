import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { Expense } from '../entities/expense.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { ExpensesService } from '../services/expenses.service';
import { PaymentSourceService } from '../../payment-sources/services/payment-sources.service';

const USER_ID = 'user-1';

const makeQb = () => {
  const qb: any = {};
  qb.where = jest.fn(() => qb);
  qb.andWhere = jest.fn(() => qb);
  qb.leftJoinAndSelect = jest.fn(() => qb);
  qb.orderBy = jest.fn(() => qb);
  qb.addOrderBy = jest.fn(() => qb);
  qb.skip = jest.fn(() => qb);
  qb.take = jest.fn(() => qb);
  qb.getCount = jest.fn(async () => 0);
  qb.getMany = jest.fn(async () => []);
  return qb;
};

const makeExpenseRepo = (qb: any) => ({
  createQueryBuilder: jest.fn(() => qb),
  create: jest.fn((x) => x),
  save: jest.fn(async (x) => ({ id: 'exp-1', ...x })),
  findOne: jest.fn(),
  softRemove: jest.fn(),
});

const tagRepo = () => ({ find: jest.fn(async () => []) });

describe('ExpensesService — payment source', () => {
  let service: ExpensesService;
  let qb: any;
  let expenseRepo: ReturnType<typeof makeExpenseRepo>;
  let paymentSourceService: { findOwnedEntity: jest.Mock };

  beforeEach(async () => {
    qb = makeQb();
    expenseRepo = makeExpenseRepo(qb);
    paymentSourceService = { findOwnedEntity: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: getRepositoryToken(Expense), useValue: expenseRepo },
        { provide: getRepositoryToken(Tag), useValue: tagRepo() },
        { provide: PaymentSourceService, useValue: paymentSourceService },
      ],
    }).compile();
    service = module.get(ExpensesService);
  });

  describe('findAll filtering', () => {
    it('adds a paymentSourceId andWhere when the filter is present', async () => {
      await service.findAll(USER_ID, { paymentSourceId: 'ps-1' } as any);
      expect(qb.andWhere).toHaveBeenCalledWith(
        'expense.paymentSourceId = :paymentSourceId',
        { paymentSourceId: 'ps-1' },
      );
    });

    it('does not add a paymentSourceId andWhere when the filter is absent', async () => {
      await service.findAll(USER_ID, {} as any);
      const calls = qb.andWhere.mock.calls.map((c: any[]) => c[0]);
      expect(calls).not.toContain('expense.paymentSourceId = :paymentSourceId');
    });

    it('left-joins the paymentSource relation for the item query', async () => {
      await service.findAll(USER_ID, {} as any);
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
        'expense.paymentSource',
        'paymentSource',
      );
    });

    it('maps paymentSource into the result when present, null when absent', async () => {
      qb.getMany.mockResolvedValue([
        {
          id: 'exp-1',
          amount: '10.00',
          paymentMethod: 'credit_card',
          description: null,
          date: '2026-03-01',
          source: 'web',
          receiptUrl: null,
          tags: [],
          created_at: new Date('2026-03-01T00:00:00Z'),
          paymentSource: {
            id: 'ps-1',
            alias: 'visa 8943',
            color: '#3B82F6',
          },
        },
        {
          id: 'exp-2',
          amount: '5.00',
          paymentMethod: 'cash',
          description: null,
          date: '2026-03-02',
          source: 'web',
          receiptUrl: null,
          tags: [],
          created_at: new Date('2026-03-02T00:00:00Z'),
          paymentSource: null,
        },
      ]);
      qb.getCount.mockResolvedValue(2);
      const page = await service.findAll(USER_ID, {} as any);
      expect(page.items[0].paymentSource).toEqual({
        id: 'ps-1',
        alias: 'visa 8943',
        color: '#3B82F6',
      });
      expect(page.items[1].paymentSource).toBeNull();
    });
  });

  describe('create', () => {
    it('resolves a valid paymentSourceId and assigns the entity', async () => {
      paymentSourceService.findOwnedEntity.mockResolvedValue({ id: 'ps-1' });
      await service.create(USER_ID, {
        amount: 10,
        paymentMethod: 'credit_card',
        date: '2026-03-01',
        paymentSourceId: 'ps-1',
      } as any);
      expect(paymentSourceService.findOwnedEntity).toHaveBeenCalledWith(
        USER_ID,
        'ps-1',
      );
      const created = expenseRepo.create.mock.calls[0][0];
      expect(created.paymentSource).toEqual({ id: 'ps-1' });
    });

    it('throws BadRequestException when the paymentSourceId is not owned', async () => {
      paymentSourceService.findOwnedEntity.mockRejectedValue(new Error('nf'));
      await expect(
        service.create(USER_ID, {
          amount: 10,
          paymentMethod: 'credit_card',
          date: '2026-03-01',
          paymentSourceId: 'ps-x',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('leaves paymentSource null when no id is given', async () => {
      await service.create(USER_ID, {
        amount: 10,
        paymentMethod: 'cash',
        date: '2026-03-01',
      } as any);
      const created = expenseRepo.create.mock.calls[0][0];
      expect(created.paymentSource ?? null).toBeNull();
    });
  });

  describe('update', () => {
    const owned = () => ({
      id: 'exp-1',
      userId: USER_ID,
      amount: '10.00',
      paymentMethod: 'credit_card',
      description: null,
      date: '2026-03-01',
      source: 'web',
      receiptUrl: null,
      tags: [],
      paymentSource: { id: 'ps-1', alias: 'visa 8943', color: '#3B82F6' },
      paymentSourceId: 'ps-1',
      created_at: new Date('2026-03-01T00:00:00Z'),
    });

    it('reassigns paymentSource when a new valid id is given', async () => {
      expenseRepo.findOne.mockResolvedValue(owned());
      paymentSourceService.findOwnedEntity.mockResolvedValue({ id: 'ps-2' });
      await service.update(USER_ID, 'exp-1', {
        paymentSourceId: 'ps-2',
      } as any);
      const saved = expenseRepo.save.mock.calls[0][0];
      expect(saved.paymentSource).toEqual({ id: 'ps-2' });
    });

    it('clears paymentSource when paymentSourceId is explicitly null', async () => {
      expenseRepo.findOne.mockResolvedValue(owned());
      await service.update(USER_ID, 'exp-1', { paymentSourceId: null } as any);
      const saved = expenseRepo.save.mock.calls[0][0];
      expect(saved.paymentSource).toBeNull();
      expect(saved.paymentSourceId).toBeNull();
    });

    it('leaves paymentSource untouched when paymentSourceId is undefined', async () => {
      expenseRepo.findOne.mockResolvedValue(owned());
      await service.update(USER_ID, 'exp-1', { amount: 20 } as any);
      const saved = expenseRepo.save.mock.calls[0][0];
      expect(saved.paymentSource).toEqual({
        id: 'ps-1',
        alias: 'visa 8943',
        color: '#3B82F6',
      });
    });
  });
});
