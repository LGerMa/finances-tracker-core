import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import { RecurringEntry } from '../entities/recurring-entry.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { CreateRecurringDto, UpdateRecurringDto } from '../dtos/recurring.dto';
import { IRecurringEntry } from '../interfaces/recurring.interface';
import { Frequency } from '../enums/recurring.enum';
import { ExpensesService } from '../../expenses/services/expenses.service';
import { IncomeService } from '../../income/services/income.service';
import { PaymentMethod } from '../../expenses/enums/expense.enum';
import { IncomeType } from '../../income/enums/income.enum';
import { Source } from '../../common/enums/source.enum';

@Injectable()
export class RecurringService {
  constructor(
    @InjectRepository(RecurringEntry)
    private readonly recurringRepository: Repository<RecurringEntry>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    private readonly expensesService: ExpensesService,
    private readonly incomeService: IncomeService,
  ) {}

  async findAll(userId: string): Promise<IRecurringEntry[]> {
    const entries = await this.recurringRepository.find({
      where: { userId },
      order: { created_at: 'DESC' },
    });
    return entries.map(this.toEntry);
  }

  async create(userId: string, dto: CreateRecurringDto): Promise<IRecurringEntry> {
    const tags = dto.tagIds?.length
      ? await this.tagRepository.find({
          where: { id: In(dto.tagIds), userId },
        })
      : [];

    const entry = this.recurringRepository.create({
      userId,
      entryType: dto.entryType,
      amount: dto.amount,
      description: dto.description ?? null,
      paymentMethod: dto.paymentMethod ?? null,
      incomeType: dto.incomeType ?? null,
      frequency: dto.frequency,
      dayOfMonth: dto.dayOfMonth ?? null,
      dayOfWeek: dto.dayOfWeek ?? null,
      nextDate: dto.nextDate,
      isActive: true,
      tags,
    });

    const saved = await this.recurringRepository.save(entry);
    return this.toEntry(saved);
  }

  async update(
    userId: string,
    entryId: string,
    dto: UpdateRecurringDto,
  ): Promise<IRecurringEntry> {
    const entry = await this.findOwned(userId, entryId);

    if (dto.tagIds !== undefined) {
      entry.tags = dto.tagIds.length
        ? await this.tagRepository.find({
            where: { id: In(dto.tagIds), userId },
          })
        : [];
    }

    Object.assign(entry, {
      ...(dto.entryType !== undefined && { entryType: dto.entryType }),
      ...(dto.amount !== undefined && { amount: dto.amount }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.paymentMethod !== undefined && { paymentMethod: dto.paymentMethod }),
      ...(dto.incomeType !== undefined && { incomeType: dto.incomeType }),
      ...(dto.frequency !== undefined && { frequency: dto.frequency }),
      ...(dto.dayOfMonth !== undefined && { dayOfMonth: dto.dayOfMonth }),
      ...(dto.dayOfWeek !== undefined && { dayOfWeek: dto.dayOfWeek }),
      ...(dto.nextDate !== undefined && { nextDate: dto.nextDate }),
    });

    const saved = await this.recurringRepository.save(entry);
    return this.toEntry(saved);
  }

  async remove(userId: string, entryId: string): Promise<void> {
    const entry = await this.findOwned(userId, entryId);
    await this.recurringRepository.softRemove(entry);
  }

  async pause(userId: string, entryId: string): Promise<IRecurringEntry> {
    const entry = await this.findOwned(userId, entryId);
    entry.isActive = false;
    const saved = await this.recurringRepository.save(entry);
    return this.toEntry(saved);
  }

  async resume(userId: string, entryId: string): Promise<IRecurringEntry> {
    const entry = await this.findOwned(userId, entryId);
    entry.isActive = true;
    entry.nextDate = this.calculateNextDate(entry);
    const saved = await this.recurringRepository.save(entry);
    return this.toEntry(saved);
  }

  @Cron('5 0 * * *') // daily at 00:05
  async processRecurringEntries(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    const dueEntries = await this.recurringRepository.find({
      where: { nextDate: LessThanOrEqual(today), isActive: true },
    });

    for (const entry of dueEntries) {
      if (entry.entryType === 'expense') {
        await this.expensesService.create(entry.userId, {
          amount: Number(entry.amount),
          paymentMethod: (entry.paymentMethod ?? PaymentMethod.CASH) as PaymentMethod,
          description: entry.description ?? undefined,
          date: today,
          source: Source.WEB,
          tagIds: entry.tags?.map((t) => t.id) ?? [],
        });
      } else {
        await this.incomeService.create(entry.userId, {
          amount: Number(entry.amount),
          type: (entry.incomeType ?? IncomeType.SPORADIC) as IncomeType,
          description: entry.description ?? undefined,
          date: today,
          source: Source.WEB,
          tagIds: entry.tags?.map((t) => t.id) ?? [],
        });
      }

      entry.nextDate = this.calculateNextDate(entry);
      await this.recurringRepository.save(entry);
    }
  }

  private calculateNextDate(entry: RecurringEntry): string {
    const current = new Date(entry.nextDate);

    if (entry.frequency === Frequency.WEEKLY) {
      current.setDate(current.getDate() + 7);
    } else if (entry.frequency === Frequency.BIWEEKLY) {
      current.setDate(current.getDate() + 14);
    } else if (entry.frequency === Frequency.MONTHLY) {
      current.setMonth(current.getMonth() + 1);
      if (entry.dayOfMonth) {
        current.setDate(Math.min(entry.dayOfMonth, 28));
      }
    }

    return current.toISOString().split('T')[0];
  }

  private async findOwned(userId: string, entryId: string): Promise<RecurringEntry> {
    const entry = await this.recurringRepository.findOne({
      where: { id: entryId, userId },
    });
    if (!entry) throw new NotFoundException('Recurring entry not found');
    return entry;
  }

  private readonly toEntry = (entry: RecurringEntry): IRecurringEntry => ({
    id: entry.id,
    entryType: entry.entryType,
    amount: Number(entry.amount),
    description: entry.description,
    paymentMethod: entry.paymentMethod,
    incomeType: entry.incomeType,
    frequency: entry.frequency,
    dayOfMonth: entry.dayOfMonth,
    dayOfWeek: entry.dayOfWeek,
    nextDate: entry.nextDate,
    isActive: entry.isActive,
    tags: (entry.tags ?? []).map((t) => ({ id: t.id, name: t.name, color: t.color })),
    createdAt: entry.created_at,
  });
}
