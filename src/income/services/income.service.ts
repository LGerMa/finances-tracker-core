import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Income } from '../entities/income.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { CreateIncomeDto, UpdateIncomeDto } from '../dtos/income.dto';
import { IncomeQueryDto } from '../dtos/income-query.dto';
import { IIncome } from '../interfaces/income.interface';
import { PageDto } from '../../common/dtos/page.dto';
import { PageMetaDto } from '../../common/dtos/page-meta.dto';
import { PageOptionsDto } from '../../common/dtos/page-options.dto';

@Injectable()
export class IncomeService {
  constructor(
    @InjectRepository(Income)
    private readonly incomeRepository: Repository<Income>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async findAll(userId: string, queryDto: IncomeQueryDto): Promise<PageDto<IIncome>> {
    const page = queryDto.page ?? 1;
    const take = queryDto.take ?? 10;
    const pageOptionsDto = new PageOptionsDto(page, take);

    const qb = this.incomeRepository
      .createQueryBuilder('income')
      .where('income.userId = :userId', { userId });

    if (queryDto.startDate) {
      qb.andWhere('income.date >= :startDate', { startDate: queryDto.startDate });
    }
    if (queryDto.endDate) {
      qb.andWhere('income.date <= :endDate', { endDate: queryDto.endDate });
    }
    if (queryDto.type) {
      qb.andWhere('income.type = :type', { type: queryDto.type });
    }
    if (queryDto.tags) {
      const tagNames = queryDto.tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (tagNames.length > 0) {
        qb.andWhere(
          `income.id IN (
            SELECT it.income_id FROM income_tags it
            INNER JOIN tags t ON t.id = it.tag_id
            WHERE t.user_id = :userId AND t.name IN (:...tagNames)
          )`,
          { tagNames },
        );
      }
    }

    const itemCount = await qb.getCount();

    const items = await qb
      .leftJoinAndSelect('income.tags', 'tag')
      .orderBy('income.date', 'DESC')
      .addOrderBy('income.created_at', 'DESC')
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take)
      .getMany();

    const meta = new PageMetaDto({ pageOptionsDto, itemCount });
    return new PageDto(items.map((e) => this.toIncome(e)), meta);
  }

  async findOne(userId: string, id: string): Promise<IIncome> {
    const income = await this.findOwned(userId, id);
    return this.toIncome(income);
  }

  async create(userId: string, dto: CreateIncomeDto): Promise<IIncome> {
    const tags = await this.resolveTagsForUser(userId, dto.tagIds ?? []);
    const income = this.incomeRepository.create({
      userId,
      amount: dto.amount,
      type: dto.type,
      description: dto.description ?? null,
      date: dto.date,
      source: dto.source,
      receiptUrl: dto.receiptUrl ?? null,
      tags,
    });
    const saved = await this.incomeRepository.save(income);
    return this.toIncome(saved);
  }

  async update(userId: string, id: string, dto: UpdateIncomeDto): Promise<IIncome> {
    const income = await this.findOwned(userId, id);

    if (dto.tagIds !== undefined) {
      income.tags = await this.resolveTagsForUser(userId, dto.tagIds);
    }
    if (dto.amount !== undefined) income.amount = dto.amount;
    if (dto.type !== undefined) income.type = dto.type;
    if (dto.description !== undefined) income.description = dto.description ?? null;
    if (dto.date !== undefined) income.date = dto.date;
    if (dto.source !== undefined) income.source = dto.source;
    if (dto.receiptUrl !== undefined) income.receiptUrl = dto.receiptUrl ?? null;

    const saved = await this.incomeRepository.save(income);
    return this.toIncome(saved);
  }

  async remove(userId: string, id: string): Promise<void> {
    const income = await this.findOwned(userId, id);
    await this.incomeRepository.remove(income);
  }

  private async findOwned(userId: string, id: string): Promise<Income> {
    const income = await this.incomeRepository.findOne({
      where: { id, userId },
      relations: ['tags'],
    });
    if (!income) throw new NotFoundException('Income not found');
    return income;
  }

  private async resolveTagsForUser(userId: string, tagIds: string[]): Promise<Tag[]> {
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

  private toIncome(income: Income): IIncome {
    return {
      id: income.id,
      amount: parseFloat(income.amount as any),
      type: income.type,
      description: income.description,
      date: income.date,
      source: income.source,
      receiptUrl: income.receiptUrl,
      tags: (income.tags ?? []).map((t) => ({ id: t.id, name: t.name, color: t.color })),
      createdAt: income.created_at,
    };
  }
}
