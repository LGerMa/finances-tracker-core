import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@lgerma/nestjs-doorkeeper';
import { IncomeService } from '../services/income.service';
import { CreateIncomeDto, UpdateIncomeDto } from '../dtos/income.dto';
import { IncomeQueryDto } from '../dtos/income-query.dto';
import { IncomeResponse } from '../dtos/income.response.dto';
import { PageDto } from '../../common/dtos/page.dto';

@ApiTags('income')
@ApiBearerAuth('JWT-auth')
@Controller('income')
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Get()
  @ApiOperation({ summary: 'List income entries with optional filters and pagination' })
  @ApiOkResponse({ type: PageDto })
  findAll(
    @CurrentUser() user: { id: string },
    @Query() queryDto: IncomeQueryDto,
  ): Promise<PageDto<IncomeResponse>> {
    return this.incomeService.findAll(user.id, queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single income entry' })
  @ApiOkResponse({ type: IncomeResponse })
  @ApiResponse({ status: 404, description: 'Income not found' })
  findOne(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ): Promise<IncomeResponse> {
    return this.incomeService.findOne(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new income entry' })
  @ApiCreatedResponse({ type: IncomeResponse })
  @ApiResponse({ status: 400, description: 'Validation error or invalid tagIds' })
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateIncomeDto,
  ): Promise<IncomeResponse> {
    return this.incomeService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an income entry' })
  @ApiOkResponse({ type: IncomeResponse })
  @ApiResponse({ status: 404, description: 'Income not found' })
  @ApiResponse({ status: 400, description: 'Invalid tagIds' })
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateIncomeDto,
  ): Promise<IncomeResponse> {
    return this.incomeService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an income entry' })
  @ApiOkResponse({ description: 'Income deleted' })
  @ApiResponse({ status: 404, description: 'Income not found' })
  async remove(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    await this.incomeService.remove(user.id, id);
    return { message: 'Income deleted' };
  }
}
