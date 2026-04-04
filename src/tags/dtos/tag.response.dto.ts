import { ApiProperty } from '@nestjs/swagger';
import { ITag } from '../interfaces/tag.interface';

export class TagResponse implements ITag {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ example: '#EF4444' })
  color: string;

  @ApiProperty()
  createdAt: Date;
}
