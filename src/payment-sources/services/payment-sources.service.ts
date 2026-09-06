import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { PaymentSource } from '../entities/payment-source.entity';
import {
  CreatePaymentSourceDto,
  UpdatePaymentSourceDto,
} from '../dtos/payment-source.dto';
import { IPaymentSource } from '../interfaces/payment-source.interface';

@Injectable()
export class PaymentSourceService {
  constructor(
    @InjectRepository(PaymentSource)
    private readonly paymentSourceRepository: Repository<PaymentSource>,
  ) {}

  async findAll(userId: string): Promise<IPaymentSource[]> {
    const sources = await this.paymentSourceRepository.find({
      where: { userId },
      order: { alias: 'ASC' },
    });
    return sources.map(this.toPaymentSource);
  }

  async create(
    userId: string,
    dto: CreatePaymentSourceDto,
  ): Promise<IPaymentSource> {
    const source = this.paymentSourceRepository.create({
      userId,
      alias: dto.alias,
      paymentMethod: dto.paymentMethod ?? null,
      color: dto.color ?? '#6B7280',
    });
    try {
      const saved = await this.paymentSourceRepository.save(source);
      return this.toPaymentSource(saved);
    } catch (e) {
      throw this.mapWriteError(e, dto.alias);
    }
  }

  async update(
    userId: string,
    id: string,
    dto: UpdatePaymentSourceDto,
  ): Promise<IPaymentSource> {
    const source = await this.findOwnedEntity(userId, id);
    Object.assign(source, dto);
    try {
      const saved = await this.paymentSourceRepository.save(source);
      return this.toPaymentSource(saved);
    } catch (e) {
      throw this.mapWriteError(e, dto.alias ?? source.alias);
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    const source = await this.findOwnedEntity(userId, id);
    await this.paymentSourceRepository.softRemove(source);
  }

  async findOwnedEntity(userId: string, id: string): Promise<PaymentSource> {
    const source = await this.paymentSourceRepository.findOne({
      where: { id, userId },
    });
    if (!source) throw new NotFoundException('Payment source not found');
    return source;
  }

  private mapWriteError(e: unknown, alias: string): unknown {
    if (
      e instanceof QueryFailedError &&
      (e as { code?: string }).code === '23505'
    ) {
      return new ConflictException(`Payment source "${alias}" already exists`);
    }
    return e;
  }

  private toPaymentSource(source: PaymentSource): IPaymentSource {
    return {
      id: source.id,
      alias: source.alias,
      paymentMethod: source.paymentMethod,
      color: source.color,
      createdAt: source.created_at,
    };
  }
}
