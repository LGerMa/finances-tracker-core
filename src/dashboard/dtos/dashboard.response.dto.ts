import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ICompareTags,
  ICompareTagItem,
  ICompareTagMonth,
  IDashboardSummary,
  ITagBreakdownItem,
  ITagBreakdownTag,
  ITrendItem,
} from '../interfaces/dashboard.interface';

export class DashboardSummaryResponse implements IDashboardSummary {
  @ApiProperty({ example: '2026-03' }) month: string;
  @ApiProperty() totalIncome: number;
  @ApiProperty() totalExpenses: number;
  @ApiProperty() balance: number;
  @ApiProperty() expenseCount: number;
  @ApiProperty() incomeCount: number;
}

export class TagBreakdownTagDto implements ITagBreakdownTag {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() color: string;
}

export class TagBreakdownItemResponse implements ITagBreakdownItem {
  @ApiPropertyOptional({ type: () => TagBreakdownTagDto }) tag?: TagBreakdownTagDto;
  @ApiPropertyOptional() untagged?: boolean;
  @ApiProperty() total: number;
  @ApiProperty() count: number;
}

export class CompareTagMonthDto implements ICompareTagMonth {
  @ApiProperty({ example: '2026-03' }) month: string;
  @ApiProperty() total: number;
}

export class CompareTagItemResponse implements ICompareTagItem {
  @ApiProperty({ type: () => TagBreakdownTagDto }) tag: TagBreakdownTagDto;
  @ApiProperty({ type: () => [CompareTagMonthDto] }) months: CompareTagMonthDto[];
  @ApiProperty() average: number;
  @ApiProperty({ enum: ['up', 'down', 'stable'] }) trend: 'up' | 'down' | 'stable';
}

export class ComparePeriodDto {
  @ApiProperty({ example: '2025-10' }) from: string;
  @ApiProperty({ example: '2026-03' }) to: string;
}

export class CompareTagsResponse implements ICompareTags {
  @ApiProperty({ type: () => ComparePeriodDto }) period: ComparePeriodDto;
  @ApiProperty({ type: () => [CompareTagItemResponse] }) tags: CompareTagItemResponse[];
}

export class TrendItemResponse implements ITrendItem {
  @ApiProperty({ example: '2026-03' }) month: string;
  @ApiProperty() totalIncome: number;
  @ApiProperty() totalExpenses: number;
}
