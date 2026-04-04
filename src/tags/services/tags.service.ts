import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Tag } from '../entities/tag.entity';
import { CreateTagDto } from '../dtos/create-tag.dto';
import { UpdateTagDto } from '../dtos/update-tag.dto';
import { ITag } from '../interfaces/tag.interface';

const STARTER_TAGS = [
  { name: 'food', color: '#EF4444' },
  { name: 'transport', color: '#F59E0B' },
  { name: 'housing', color: '#8B5CF6' },
  { name: 'subscriptions', color: '#3B82F6' },
  { name: 'health', color: '#10B981' },
  { name: 'entertainment', color: '#EC4899' },
  { name: 'education', color: '#6366F1' },
  { name: 'salary', color: '#22C55E' },
  { name: 'freelance', color: '#14B8A6' },
];

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async findAll(userId: string): Promise<ITag[]> {
    const tags = await this.tagRepository.find({
      where: { userId },
      order: { name: 'ASC' },
    });
    return tags.map(this.toTag);
  }

  async create(userId: string, dto: CreateTagDto): Promise<ITag> {
    const tag = this.tagRepository.create({
      userId,
      name: dto.name,
      color: dto.color ?? '#6B7280',
    });
    try {
      const saved = await this.tagRepository.save(tag);
      return this.toTag(saved);
    } catch (e) {
      if (e instanceof QueryFailedError && (e as any).code === '23505') {
        throw new ConflictException(`Tag "${dto.name}" already exists`);
      }
      throw e;
    }
  }

  async update(userId: string, tagId: string, dto: UpdateTagDto): Promise<ITag> {
    const tag = await this.findOwned(userId, tagId);
    Object.assign(tag, dto);
    try {
      const saved = await this.tagRepository.save(tag);
      return this.toTag(saved);
    } catch (e) {
      if (e instanceof QueryFailedError && (e as any).code === '23505') {
        throw new ConflictException(`Tag "${dto.name}" already exists`);
      }
      throw e;
    }
  }

  async remove(userId: string, tagId: string): Promise<void> {
    const tag = await this.findOwned(userId, tagId);
    await this.tagRepository.remove(tag);
  }

  async seedStarterTags(userId: string): Promise<void> {
    const tags = STARTER_TAGS.map((t) =>
      this.tagRepository.create({ userId, ...t }),
    );
    await this.tagRepository.save(tags);
  }

  private async findOwned(userId: string, tagId: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({
      where: { id: tagId, userId },
    });
    if (!tag) throw new NotFoundException('Tag not found');
    return tag;
  }

  private toTag(tag: Tag): ITag {
    return {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      createdAt: tag.created_at,
    };
  }
}
