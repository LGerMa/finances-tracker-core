import { ApiProperty } from '@nestjs/swagger';
import {
  ISearchExpenseItem,
  ISearchIncomeItem,
  ISearchResult,
  ISearchTag,
  ISearchTagItem,
} from '../interfaces/search.interface';

export class SearchTagRef implements ISearchTag {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ example: '#EF4444' }) color: string;
}

export class SearchExpenseItem implements ISearchExpenseItem {
  @ApiProperty() id: string;
  @ApiProperty({ nullable: true }) description: string | null;
  @ApiProperty() amount: number;
  @ApiProperty({ example: '2026-05-03' }) date: string;
  @ApiProperty({ type: () => [SearchTagRef] }) tags: SearchTagRef[];
}

export class SearchIncomeItem implements ISearchIncomeItem {
  @ApiProperty() id: string;
  @ApiProperty({ nullable: true }) description: string | null;
  @ApiProperty() amount: number;
  @ApiProperty({ example: '2026-05-01' }) date: string;
  @ApiProperty({ type: () => [SearchTagRef] }) tags: SearchTagRef[];
}

export class SearchTagItem implements ISearchTagItem {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ example: '#EF4444' }) color: string;
}

export class SearchResponse implements ISearchResult {
  @ApiProperty({ type: () => [SearchExpenseItem] }) expenses: SearchExpenseItem[];
  @ApiProperty({ type: () => [SearchIncomeItem] }) income: SearchIncomeItem[];
  @ApiProperty({ type: () => [SearchTagItem] }) tags: SearchTagItem[];
}
