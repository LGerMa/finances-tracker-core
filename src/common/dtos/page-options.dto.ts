import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PageOptionsDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  readonly page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 10 })
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  @IsOptional()
  readonly take?: number;

  @IsOptional()
  readonly skip?: number;

  constructor(page: number = 1, take: number = 10) {
    this.page = page;
    this.take = take;
    this.skip = (this.page - 1) * this.take;
  }
}
