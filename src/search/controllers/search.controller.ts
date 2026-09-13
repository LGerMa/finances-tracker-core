import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@lgerma/nestjs-doorkeeper';
import { SearchService } from '../services/search.service';
import { SearchQueryDto } from '../dtos/search-query.dto';
import { SearchResponse } from '../dtos/search.response.dto';

@ApiTags('search')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'search', version: '1' })
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Search expenses, income, and tags by description/name',
  })
  @ApiOkResponse({ type: SearchResponse })
  search(
    @CurrentUser() user: { id: string },
    @Query() queryDto: SearchQueryDto,
  ): Promise<SearchResponse> {
    return this.searchService.search(user.id, queryDto);
  }
}
