import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RecurringService } from '../services/recurring.service';
import { RecurringEntry } from '../entities/recurring-entry.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { ExpensesService } from '../../expenses/services/expenses.service';
import { IncomeService } from '../../income/services/income.service';
import { PaymentSourceService } from '../../payment-sources/services/payment-sources.service';
import { CreateRecurringDto } from '../dtos/recurring.dto';
import { EntryType, Frequency } from '../enums/recurring.enum';
import { PaymentMethod, ExpenseType } from '../../expenses/enums/expense.enum';
import { IncomeType } from '../../income/enums/income.enum';
import { Source } from '../../common/enums/source.enum';

const USER_ID = 'user-1';

type MockRepo = {
  find: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  softRemove: jest.Mock;
};

const makeRepo = (): MockRepo => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((x: unknown) => x),
  save: jest.fn((e: unknown) => Promise.resolve(e)),
  softRemove: jest.fn(),
});

const entry = (over: Partial<RecurringEntry> = {}): RecurringEntry =>
  ({
    id: 're-1',
    userId: USER_ID,
    entryType: EntryType.EXPENSE,
    amount: 42.5,
    description: 'Netflix',
    paymentMethod: PaymentMethod.CASH,
    incomeType: null,
    frequency: Frequency.MONTHLY,
    dayOfMonth: 6,
    dayOfWeek: null,
    nextDate: '2026-09-06',
    isActive: true,
    tags: [],
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    deleted_at: null,
    ...over,
  }) as RecurringEntry;

describe('RecurringService', () => {
  let service: RecurringService;
  let recurringRepo: MockRepo;
  let expensesService: { create: jest.Mock };
  let incomeService: { create: jest.Mock };
  let paymentSourceService: { findOwnedEntity: jest.Mock };

  beforeEach(async () => {
    recurringRepo = makeRepo();
    expensesService = { create: jest.fn() };
    incomeService = { create: jest.fn() };
    paymentSourceService = { findOwnedEntity: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringService,
        {
          provide: getRepositoryToken(RecurringEntry),
          useValue: recurringRepo,
        },
        { provide: getRepositoryToken(Tag), useValue: makeRepo() },
        { provide: ExpensesService, useValue: expensesService },
        { provide: IncomeService, useValue: incomeService },
        { provide: PaymentSourceService, useValue: paymentSourceService },
      ],
    }).compile();
    service = module.get(RecurringService);
  });

  describe('processRecurringEntries', () => {
    it('stamps the created expense with the entry occurrence date, not today', async () => {
      recurringRepo.find.mockResolvedValue([entry()]);

      await service.processRecurringEntries();

      expect(expensesService.create).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({
          amount: 42.5,
          paymentMethod: PaymentMethod.CASH,
          description: 'Netflix',
          date: '2026-09-06',
          source: Source.WEB,
          tagIds: [],
        }),
      );
    });

    it('stamps the created expense with type FIXED', async () => {
      recurringRepo.find.mockResolvedValue([entry()]);

      await service.processRecurringEntries();

      expect(expensesService.create).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ type: ExpenseType.FIXED }),
      );
    });

    it('stamps the created income with the entry occurrence date', async () => {
      recurringRepo.find.mockResolvedValue([
        entry({
          entryType: EntryType.INCOME,
          paymentMethod: null,
          incomeType: IncomeType.SPORADIC,
        }),
      ]);

      await service.processRecurringEntries();

      expect(incomeService.create).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({
          type: IncomeType.SPORADIC,
          date: '2026-09-06',
          source: Source.WEB,
        }),
      );
    });

    it('advances nextDate from the previous occurrence date', async () => {
      const e = entry();
      recurringRepo.find.mockResolvedValue([e]);

      await service.processRecurringEntries();

      expect(e.nextDate).toBe('2026-10-06');
      expect(recurringRepo.save).toHaveBeenCalledWith(e);
    });

    it('forwards the entry payment source to the created expense', async () => {
      recurringRepo.find.mockResolvedValue([
        entry({ paymentSourceId: 'ps-1' }),
      ]);

      await service.processRecurringEntries();

      expect(expensesService.create).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ paymentSourceId: 'ps-1' }),
      );
    });

    it('passes undefined payment source when the entry has none', async () => {
      recurringRepo.find.mockResolvedValue([entry({ paymentSourceId: null })]);

      await service.processRecurringEntries();

      expect(expensesService.create).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ paymentSourceId: undefined }),
      );
    });
  });

  describe('create', () => {
    const dto: CreateRecurringDto = {
      entryType: EntryType.EXPENSE,
      amount: 6.99,
      frequency: Frequency.MONTHLY,
      nextDate: '2026-09-06',
      paymentSourceId: 'ps-1',
    };

    it('validates payment source ownership and persists the id', async () => {
      paymentSourceService.findOwnedEntity.mockResolvedValue({
        id: 'ps-1',
        alias: 'visa 8943',
        color: '#3B82F6',
      });

      const result = await service.create(USER_ID, dto);

      expect(paymentSourceService.findOwnedEntity).toHaveBeenCalledWith(
        USER_ID,
        'ps-1',
      );
      expect(recurringRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ paymentSourceId: 'ps-1' }),
      );
      expect(result.paymentSource).toEqual({
        id: 'ps-1',
        alias: 'visa 8943',
        color: '#3B82F6',
      });
    });

    it('rejects a payment source that does not belong to the user', async () => {
      paymentSourceService.findOwnedEntity.mockRejectedValue(new Error('nope'));

      await expect(service.create(USER_ID, dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(recurringRepo.save).not.toHaveBeenCalled();
    });
  });
});
