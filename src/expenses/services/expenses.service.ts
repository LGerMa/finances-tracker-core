import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Expense } from '../entities/expense.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { CreateExpenseDto, UpdateExpenseDto } from '../dtos/expense.dto';
import { ExpenseQueryDto } from '../dtos/expense-query.dto';
import { IExpense } from '../interfaces/expense.interface';
import { PageDto } from '../../common/dtos/page.dto';
import { PageMetaDto } from '../../common/dtos/page-meta.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async findAll(userId: string, queryDto: ExpenseQueryDto): Promise<PageDto<IExpense>> {
    const page = queryDto.page ?? 1;
    const take = queryDto.take ?? 10;
    const skip = (page - 1) * take;

    const qb = this.expenseRepository
      .createQueryBuilder('expense')
      .where('expense.userId = :userId', { userId });

    if (queryDto.startDate) {
      qb.andWhere('expense.date >= :startDate', { startDate: queryDto.startDate });
    }
    if (queryDto.endDate) {
      qb.andWhere('expense.date <= :endDate', { endDate: queryDto.endDate });
    }
    if (queryDto.paymentMethod) {
      qb.andWhere('expense.paymentMethod = :paymentMethod', { paymentMethod: queryDto.paymentMethod });
    }
    if (queryDto.tags) {
      const tagNames = queryDto.tags.split(',').map(t => t.trim()).filter(Boolean);
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
      .orderBy('expense.date', 'DESC')
      .addOrderBy('expense.created_at', 'DESC')
      .skip(skip)
      .take(take)
      .getMany();

    const meta = new PageMetaDto({ pageOptionsDto: queryDto, itemCount });
    return new PageDto(items.map(e => this.toExpense(e)), meta);
  }

  async findOne(userId: string, id: string): Promise<IExpense> {
    const expense = await this.findOwned(userId, id);
    return this.toExpense(expense);
  }

  async create(userId: string, dto: CreateExpenseDto): Promise<IExpense> {
    const tags = await this.resolveTagsForUser(userId, dto.tagIds ?? []);
    const expense = this.expenseRepository.create({
      userId,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      description: dto.description ?? null,
      date: dto.date,
      tags,
    });
    const saved = await this.expenseRepository.save(expense);
    return this.toExpense(saved);
  }

  async update(userId: string, id: string, dto: UpdateExpenseDto): Promise<IExpense> {
    const expense = await this.findOwned(userId, id);

    if (dto.tagIds !== undefined) {
      expense.tags = await this.resolveTagsForUser(userId, dto.tagIds);
    }
    if (dto.amount !== undefined) expense.amount = dto.amount;
    if (dto.paymentMethod !== undefined) expense.paymentMethod = dto.paymentMethod;
    if (dto.description !== undefined) expense.description = dto.description ?? null;
    if (dto.date !== undefined) expense.date = dto.date;

    const saved = await this.expenseRepository.save(expense);
    return this.toExpense(saved);
  }

  async remove(userId: string, id: string): Promise<void> {
    const expense = await this.findOwned(userId, id);
    await this.expenseRepository.remove(expense);
  }

  private async findOwned(userId: string, id: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id, userId },
      relations: ['tags'],
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  private async resolveTagsForUser(userId: string, tagIds: string[]): Promise<Tag[]> {
    if (tagIds.length === 0) return [];
    const tags = await this.tagRepository.find({
      where: { id: In(tagIds), userId },
    });
    if (tags.length !== tagIds.length) {
      throw new BadRequestException('One or more tagIds are invalid or do not belong to you');
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
      tags: (expense.tags ?? []).map(t => ({ id: t.id, name: t.name, color: t.color })),
      createdAt: expense.created_at,
    };
  }
}
