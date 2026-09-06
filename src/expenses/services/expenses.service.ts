import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Expense } from '../entities/expense.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { PaymentSource } from '../../payment-sources/entities/payment-source.entity';
import { PaymentSourceService } from '../../payment-sources/services/payment-sources.service';
import { CreateExpenseDto, UpdateExpenseDto } from '../dtos/expense.dto';
import { ExpenseQueryDto } from '../dtos/expense-query.dto';
import { IExpense } from '../interfaces/expense.interface';
import { PageDto } from '../../common/dtos/page.dto';
import { PageMetaDto } from '../../common/dtos/page-meta.dto';
import { PageOptionsDto } from '../../common/dtos/page-options.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    private readonly paymentSourceService: PaymentSourceService,
  ) {}

  async findAll(
    userId: string,
    queryDto: ExpenseQueryDto,
  ): Promise<PageDto<IExpense>> {
    const page = queryDto.page ?? 1;
    const take = queryDto.take ?? 10;

    const pageOptionsDto = new PageOptionsDto(page, take);

    const qb = this.expenseRepository
      .createQueryBuilder('expense')
      .where('expense.userId = :userId', { userId });

    if (queryDto.startDate) {
      qb.andWhere('expense.date >= :startDate', {
        startDate: queryDto.startDate,
      });
    }
    if (queryDto.endDate) {
      qb.andWhere('expense.date <= :endDate', { endDate: queryDto.endDate });
    }
    if (queryDto.paymentMethod) {
      qb.andWhere('expense.paymentMethod = :paymentMethod', {
        paymentMethod: queryDto.paymentMethod,
      });
    }
    if (queryDto.paymentSourceId) {
      qb.andWhere('expense.paymentSourceId = :paymentSourceId', {
        paymentSourceId: queryDto.paymentSourceId,
      });
    }
    if (queryDto.tags) {
      const tagNames = queryDto.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      if (tagNames.length > 0) {
        qb.andWhere(
          `expense.id IN (
            SELECT et.expense_id FROM expense_tags et
            INNER JOIN tags t ON t.id = et.tag_id
            WHERE t.user_id = :userId AND t.name IN (:...tagNames)
          )`,
          { tagNames },
        );
      }
    }

    const itemCount = await qb.getCount();

    const items = await qb
      .leftJoinAndSelect('expense.tags', 'tag')
      .leftJoinAndSelect('expense.paymentSource', 'paymentSource')
      .orderBy('expense.date', 'DESC')
      .addOrderBy('expense.created_at', 'DESC')
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take)
      .getMany();

    const meta = new PageMetaDto({ pageOptionsDto, itemCount });
    return new PageDto(
      items.map((e) => this.toExpense(e)),
      meta,
    );
  }

  async findOne(userId: string, id: string): Promise<IExpense> {
    const expense = await this.findOwned(userId, id);
    return this.toExpense(expense);
  }

  async create(userId: string, dto: CreateExpenseDto): Promise<IExpense> {
    const tags = await this.resolveTagsForUser(userId, dto.tagIds ?? []);
    const paymentSource = await this.resolvePaymentSourceForUser(
      userId,
      dto.paymentSourceId,
    );
    const expense = this.expenseRepository.create({
      userId,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      description: dto.description ?? null,
      date: dto.date,
      source: dto.source,
      receiptUrl: dto.receiptUrl ?? null,
      tags,
      paymentSource,
    });
    const saved = await this.expenseRepository.save(expense);
    return this.toExpense(saved);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateExpenseDto,
  ): Promise<IExpense> {
    const expense = await this.findOwned(userId, id);

    if (dto.tagIds !== undefined) {
      expense.tags = await this.resolveTagsForUser(userId, dto.tagIds);
    }
    if (dto.paymentSourceId !== undefined) {
      const source = await this.resolvePaymentSourceForUser(
        userId,
        dto.paymentSourceId,
      );
      expense.paymentSource = source;
      expense.paymentSourceId = source ? source.id : null;
    }
    if (dto.amount !== undefined) expense.amount = dto.amount;
    if (dto.paymentMethod !== undefined)
      expense.paymentMethod = dto.paymentMethod;
    if (dto.description !== undefined)
      expense.description = dto.description ?? null;
    if (dto.date !== undefined) expense.date = dto.date;
    if (dto.source !== undefined) expense.source = dto.source;
    if (dto.receiptUrl !== undefined)
      expense.receiptUrl = dto.receiptUrl ?? null;

    const saved = await this.expenseRepository.save(expense);
    return this.toExpense(saved);
  }

  async remove(userId: string, id: string): Promise<void> {
    const expense = await this.findOwned(userId, id);
    await this.expenseRepository.softRemove(expense);
  }

  private async findOwned(userId: string, id: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id, userId },
      relations: ['tags', 'paymentSource'],
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  private async resolvePaymentSourceForUser(
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

  private async resolveTagsForUser(
    userId: string,
    tagIds: string[],
  ): Promise<Tag[]> {
    if (tagIds.length === 0) return [];
    const tags = await this.tagRepository.find({
      where: { id: In(tagIds), userId },
    });
    if (tags.length !== tagIds.length) {
      throw new BadRequestException(
        'One or more tagIds are invalid or do not belong to you',
      );
    }
    return tags;
  }

  private toExpense(expense: Expense): IExpense {
    return {
      id: expense.id,
      amount: parseFloat(expense.amount as any),
      paymentMethod: expense.paymentMethod,
      description: expense.description,
      date: expense.date,
      source: expense.source,
      receiptUrl: expense.receiptUrl,
      tags: (expense.tags ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
      })),
      paymentSource: expense.paymentSource
        ? {
            id: expense.paymentSource.id,
            alias: expense.paymentSource.alias,
            color: expense.paymentSource.color,
          }
        : null,
      createdAt: expense.created_at,
    };
  }
}
