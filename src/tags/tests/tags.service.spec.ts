import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { TagsService } from '../services/tags.service';
import { Tag } from '../entities/tag.entity';
import { Budget } from '../../budgets/entities/budget.entity';
import { Expense } from '../../expenses/entities/expense.entity';

const USER_ID = 'user-1';

type MockRepo = {
  find: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  softRemove: jest.Mock;
  delete: jest.Mock;
  query: jest.Mock;
};

const makeRepo = (): MockRepo => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((x) => x),
  save: jest.fn(),
  softRemove: jest.fn(),
  delete: jest.fn(),
  query: jest.fn(),
});

const sampleTag = (over: Partial<Tag> = {}): Tag =>
  ({
    id: 'tag-1',
    userId: USER_ID,
    name: 'food',
    color: '#EF4444',
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    deleted_at: null,
    ...over,
  }) as Tag;

describe('TagsService', () => {
  let service: TagsService;
  let tagRepo: MockRepo;
  let budgetRepo: MockRepo;
  let expenseRepo: MockRepo;

  beforeEach(async () => {
    tagRepo = makeRepo();
    budgetRepo = makeRepo();
    expenseRepo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        { provide: getRepositoryToken(Tag), useValue: tagRepo },
        { provide: getRepositoryToken(Budget), useValue: budgetRepo },
        { provide: getRepositoryToken(Expense), useValue: expenseRepo },
      ],
    }).compile();
    service = module.get(TagsService);
  });

  describe('remove', () => {
    it('deletes any budget tied to the tag before soft-removing it', async () => {
      const tag = sampleTag();
      tagRepo.findOne.mockResolvedValue(tag);
      await service.remove(USER_ID, 'tag-1');

      expect(budgetRepo.delete).toHaveBeenCalledWith({
        userId: USER_ID,
        tagId: 'tag-1',
      });
      expect(tagRepo.softRemove).toHaveBeenCalledWith(tag);
    });

    it('removes the tag from any expense it was attached to', async () => {
      const tag = sampleTag();
      tagRepo.findOne.mockResolvedValue(tag);
      await service.remove(USER_ID, 'tag-1');

      expect(expenseRepo.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM expense_tags'),
        ['tag-1'],
      );
    });

    it('deletes the budget and expense links before soft-removing the tag (ordering)', async () => {
      const calls: string[] = [];
      const tag = sampleTag();
      tagRepo.findOne.mockResolvedValue(tag);
      budgetRepo.delete.mockImplementation(async () => {
        calls.push('budget.delete');
      });
      expenseRepo.query.mockImplementation(async () => {
        calls.push('expense_tags.delete');
      });
      tagRepo.softRemove.mockImplementation(async () => {
        calls.push('tag.softRemove');
      });

      await service.remove(USER_ID, 'tag-1');

      expect(calls).toEqual([
        'budget.delete',
        'expense_tags.delete',
        'tag.softRemove',
      ]);
    });

    it('throws NotFoundException when the tag is not owned, without touching budgets or expenses', async () => {
      tagRepo.findOne.mockResolvedValue(null);
      await expect(service.remove(USER_ID, 'tag-x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(budgetRepo.delete).not.toHaveBeenCalled();
      expect(expenseRepo.query).not.toHaveBeenCalled();
      expect(tagRepo.softRemove).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('throws ConflictException on a duplicate tag name (pg 23505)', async () => {
      const err = new QueryFailedError('q', [], new Error('dup'));
      (err as any).code = '23505';
      tagRepo.save.mockRejectedValue(err);
      await expect(
        service.create(USER_ID, { name: 'food' } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
