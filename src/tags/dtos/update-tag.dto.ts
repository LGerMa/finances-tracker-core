import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsHexColor, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTagDto {
  @ApiPropertyOptional({ example: 'rideshare' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: '#7C3AED' })
  @IsOptional()
  @IsHexColor()
  color?: string;
}
