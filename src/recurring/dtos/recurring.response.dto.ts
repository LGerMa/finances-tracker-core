import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IRecurringEntry,
  IRecurringTag,
} from '../interfaces/recurring.interface';

export class RecurringTagItem implements IRecurringTag {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ example: '#EF4444' }) color: string;
}

export class RecurringEntryResponse implements IRecurringEntry {
  @ApiProperty() id: string;
  @ApiProperty({ enum: ['expense', 'income'] }) entryType: string;
  @ApiProperty() amount: number;
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiPropertyOptional({ nullable: true }) paymentMethod: string | null;
  @ApiPropertyOptional({ nullable: true }) incomeType: string | null;
  @ApiProperty({ enum: ['weekly', 'biweekly', 'monthly'] }) frequency: string;
  @ApiPropertyOptional({ nullable: true }) dayOfMonth: number | null;
  @ApiPropertyOptional({ nullable: true }) dayOfWeek: number | null;
  @ApiProperty({ example: '2026-05-01' }) nextDate: string;
  @ApiProperty() isActive: boolean;
  @ApiProperty({ type: () => [RecurringTagItem] }) tags: RecurringTagItem[];
  @ApiProperty() createdAt: Date;
}
