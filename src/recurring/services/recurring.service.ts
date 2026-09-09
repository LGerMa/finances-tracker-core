import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import { RecurringEntry } from '../entities/recurring-entry.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { CreateRecurringDto, UpdateRecurringDto } from '../dtos/recurring.dto';
import { IRecurringEntry } from '../interfaces/recurring.interface';
import { EntryType, Frequency } from '../enums/recurring.enum';
import { ExpensesService } from '../../expenses/services/expenses.service';
import { IncomeService } from '../../income/services/income.service';
import { PaymentSource } from '../../payment-sources/entities/payment-source.entity';
import { PaymentSourceService } from '../../payment-sources/services/payment-sources.service';
import { PaymentMethod, ExpenseType } from '../../expenses/enums/expense.enum';
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
    private readonly paymentSourceService: PaymentSourceService,
  ) {}

  async findAll(userId: string): Promise<IRecurringEntry[]> {
    const entries = await this.recurringRepository.find({
      where: { userId },
      order: { created_at: 'DESC' },
    });
    return entries.map(this.toEntry);
  }

  async create(
    userId: string,
    dto: CreateRecurringDto,
  ): Promise<IRecurringEntry> {
    const tags = dto.tagIds?.length
      ? await this.tagRepository.find({
          where: { id: In(dto.tagIds), userId },
        })
      : [];

    const paymentSource = await this.resolvePaymentSource(
      userId,
      dto.paymentSourceId,
    );

    const entry = this.recurringRepository.create({
      userId,
      entryType: dto.entryType,
      amount: dto.amount,
      description: dto.description ?? null,
      paymentMethod: dto.paymentMethod ?? null,
      incomeType: dto.incomeType ?? null,
      paymentSource,
      paymentSourceId: paymentSource ? paymentSource.id : null,
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

    if (dto.paymentSourceId !== undefined) {
      const source = await this.resolvePaymentSource(
        userId,
        dto.paymentSourceId,
      );
      entry.paymentSource = source;
      entry.paymentSourceId = source ? source.id : null;
    }

    Object.assign(entry, {
      ...(dto.entryType !== undefined && { entryType: dto.entryType }),
      ...(dto.amount !== undefined && { amount: dto.amount }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.paymentMethod !== undefined && {
        paymentMethod: dto.paymentMethod,
      }),
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
    const today = this.formatDate(new Date());

    const dueEntries = await this.recurringRepository.find({
      where: { nextDate: LessThanOrEqual(today), isActive: true },
    });

    for (const entry of dueEntries) {
      // Stamp the transaction with the occurrence date the entry is due for,
      // not the day the job happens to run (which may be later, or a catch-up).
      const occurrenceDate = entry.nextDate;

      if (entry.entryType === EntryType.EXPENSE) {
        await this.expensesService.create(entry.userId, {
          amount: Number(entry.amount),
          paymentMethod: (entry.paymentMethod ??
            PaymentMethod.CASH) as PaymentMethod,
          paymentSourceId: entry.paymentSourceId ?? undefined,
          description: entry.description ?? undefined,
          date: occurrenceDate,
          source: Source.WEB,
          type: ExpenseType.FIXED,
          tagIds: entry.tags?.map((t) => t.id) ?? [],
        });
      } else {
        await this.incomeService.create(entry.userId, {
          amount: Number(entry.amount),
          type: (entry.incomeType ?? IncomeType.SPORADIC) as IncomeType,
          description: entry.description ?? undefined,
          date: occurrenceDate,
          source: Source.WEB,
          tagIds: entry.tags?.map((t) => t.id) ?? [],
        });
      }

      entry.nextDate = this.calculateNextDate(entry);
      await this.recurringRepository.save(entry);
    }
  }

  private calculateNextDate(entry: RecurringEntry): string {
    // Parse as a calendar date (no time / timezone component) so month and day
    // arithmetic can't slip across a day boundary via UTC conversion.
    const [year, month, day] = entry.nextDate.split('-').map(Number);
    const current = new Date(year, month - 1, day);

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

    return this.formatDate(current);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private async findOwned(
    userId: string,
    entryId: string,
  ): Promise<RecurringEntry> {
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
    tags: (entry.tags ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
    })),
    paymentSource: entry.paymentSource
      ? {
          id: entry.paymentSource.id,
          alias: entry.paymentSource.alias,
          color: entry.paymentSource.color,
        }
      : null,
    createdAt: entry.created_at,
  });

  private async resolvePaymentSource(
    userId: string,
    paymentSourceId: string | null | undefined,
  ): Promise<PaymentSource | null> {
    if (!paymentSourceId) return null;
    try {
      return await this.paymentSourceService.findOwnedEntity(
        userId,
        paymentSourceId,
      );
    } catch {
      throw new BadRequestException(
        'paymentSourceId is invalid or does not belong to you',
      );
    }
  }
}
