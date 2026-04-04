import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@lgerma/nestjs-doorkeeper';
import { DashboardService } from '../services/dashboard.service';
import {
  ByTagsQueryDto,
  CompareTagsQueryDto,
  SummaryQueryDto,
  TrendsQueryDto,
} from '../dtos/dashboard-query.dto';
import {
  CompareTagsResponse,
  DashboardSummaryResponse,
  TagBreakdownItemResponse,
  TrendItemResponse,
} from '../dtos/dashboard.response.dto';

@ApiTags('dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Monthly income/expense summary' })
  @ApiOkResponse({ type: DashboardSummaryResponse })
  summary(
    @CurrentUser() user: { id: string },
    @Query() queryDto: SummaryQueryDto,
  ): Promise<DashboardSummaryResponse> {
    return this.dashboardService.summary(user.id, queryDto);
  }

  @Get('by-tags')
  @ApiOperation({ summary: 'Breakdown by tag for a given month' })
  @ApiOkResponse({ type: [TagBreakdownItemResponse] })
  byTags(
    @CurrentUser() user: { id: string },
    @Query() queryDto: ByTagsQueryDto,
  ): Promise<TagBreakdownItemResponse[]> {
    return this.dashboardService.byTags(user.id, queryDto);
  }

  @Get('compare-tags')
  @ApiOperation({ summary: 'Compare 2–5 tags over time' })
  @ApiOkResponse({ type: CompareTagsResponse })
  compareTags(
    @CurrentUser() user: { id: string },
    @Query() queryDto: CompareTagsQueryDto,
  ): Promise<CompareTagsResponse> {
    return this.dashboardService.compareTags(user.id, queryDto);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Monthly income vs expenses trends' })
  @ApiOkResponse({ type: [TrendItemResponse] })
  trends(
    @CurrentUser() user: { id: string },
    @Query() queryDto: TrendsQueryDto,
  ): Promise<TrendItemResponse[]> {
    return this.dashboardService.trends(user.id, queryDto);
  }
}
