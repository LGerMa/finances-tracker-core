import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsHexColor, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ example: 'food' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: '#EF4444' })
  @IsHexColor()
  color?: string;
}

export class UpdateTagDto extends PartialType(CreateTagDto) {}
