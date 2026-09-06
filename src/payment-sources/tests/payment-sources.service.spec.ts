import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { PaymentSourceService } from '../services/payment-sources.service';
import { PaymentSource } from '../entities/payment-source.entity';

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
  create: jest.fn((x) => x),
  save: jest.fn(),
  softRemove: jest.fn(),
});

const sample = (over: Partial<PaymentSource> = {}): PaymentSource =>
  ({
    id: 'ps-1',
    userId: USER_ID,
    alias: 'visa 8943',
    paymentMethod: 'credit_card',
    color: '#3B82F6',
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    deleted_at: null,
    ...over,
  }) as PaymentSource;

describe('PaymentSourceService', () => {
  let service: PaymentSourceService;
  let repo: MockRepo;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentSourceService,
        { provide: getRepositoryToken(PaymentSource), useValue: repo },
      ],
    }).compile();
    service = module.get(PaymentSourceService);
  });

  describe('findAll', () => {
    it("returns the user's sources ordered by alias, mapped to IPaymentSource", async () => {
      repo.find.mockResolvedValue([sample()]);
      const result = await service.findAll(USER_ID);
      expect(repo.find).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        order: { alias: 'ASC' },
      });
      expect(result).toEqual([
        {
          id: 'ps-1',
          alias: 'visa 8943',
          paymentMethod: 'credit_card',
          color: '#3B82F6',
          createdAt: new Date('2026-01-01T00:00:00Z'),
        },
      ]);
    });
  });

  describe('create', () => {
    it('saves and returns the mapped source', async () => {
      repo.save.mockResolvedValue(sample());
      const result = await service.create(USER_ID, {
        alias: 'visa 8943',
        paymentMethod: undefined,
        color: undefined,
      } as any);
      expect(repo.create).toHaveBeenCalledWith({
        userId: USER_ID,
        alias: 'visa 8943',
        paymentMethod: null,
        color: '#6B7280',
      });
      expect(result.alias).toBe('visa 8943');
    });

    it('throws ConflictException on a duplicate active alias (pg 23505)', async () => {
      const err = new QueryFailedError('q', [], new Error('dup'));
      (err as any).code = '23505';
      repo.save.mockRejectedValue(err);
      await expect(
        service.create(USER_ID, { alias: 'visa 8943' } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the source is not owned', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.update(USER_ID, 'ps-x', { alias: 'new' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('applies changes and returns the mapped source', async () => {
      repo.findOne.mockResolvedValue(sample());
      repo.save.mockImplementation(async (e) => e);
      const result = await service.update(USER_ID, 'ps-1', {
        alias: 'visa gold',
      } as any);
      expect(result.alias).toBe('visa gold');
    });

    it('throws ConflictException on a duplicate alias (pg 23505)', async () => {
      repo.findOne.mockResolvedValue(sample());
      const err = new QueryFailedError('q', [], new Error('dup'));
      (err as any).code = '23505';
      repo.save.mockRejectedValue(err);
      await expect(
        service.update(USER_ID, 'ps-1', { alias: 'dup' } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('remove', () => {
    it('soft-removes an owned source', async () => {
      const entity = sample();
      repo.findOne.mockResolvedValue(entity);
      await service.remove(USER_ID, 'ps-1');
      expect(repo.softRemove).toHaveBeenCalledWith(entity);
    });

    it('throws NotFoundException when not owned', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove(USER_ID, 'ps-x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findOwnedEntity', () => {
    it('returns the entity when owned', async () => {
      const entity = sample();
      repo.findOne.mockResolvedValue(entity);
      await expect(service.findOwnedEntity(USER_ID, 'ps-1')).resolves.toBe(
        entity,
      );
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'ps-1', userId: USER_ID },
      });
    });

    it('throws NotFoundException when not owned', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.findOwnedEntity(USER_ID, 'ps-x'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
