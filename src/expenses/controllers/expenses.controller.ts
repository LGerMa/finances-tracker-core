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
import { ExpensesService } from '../services/expenses.service';
import { CreateExpenseDto, UpdateExpenseDto } from '../dtos/expense.dto';
import { ExpenseQueryDto } from '../dtos/expense-query.dto';
import { ExpenseResponse } from '../dtos/expense.response.dto';
import { PageDto } from '../../common/dtos/page.dto';

@ApiTags('expenses')
@ApiBearerAuth('JWT-auth')
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'List expenses with optional filters and pagination' })
  @ApiOkResponse({ type: PageDto })
  findAll(
    @CurrentUser() user: { id: string },
    @Query() queryDto: ExpenseQueryDto,
  ): Promise<PageDto<ExpenseResponse>> {
    return this.expensesService.findAll(user.id, queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single expense' })
  @ApiOkResponse({ type: ExpenseResponse })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  findOne(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ): Promise<ExpenseResponse> {
    return this.expensesService.findOne(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new expense' })
  @ApiCreatedResponse({ type: ExpenseResponse })
  @ApiResponse({ status: 400, description: 'Validation error or invalid tagIds' })
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateExpenseDto,
  ): Promise<ExpenseResponse> {
    return this.expensesService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an expense' })
  @ApiOkResponse({ type: ExpenseResponse })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  @ApiResponse({ status: 400, description: 'Invalid tagIds' })
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ): Promise<ExpenseResponse> {
    return this.expensesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an expense' })
  @ApiOkResponse({ description: 'Expense deleted' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  async remove(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    await this.expensesService.remove(user.id, id);
    return { message: 'Expense deleted' };
  }
}
