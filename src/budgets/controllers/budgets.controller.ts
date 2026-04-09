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
import { BudgetsService } from '../services/budgets.service';
import { CreateBudgetDto, UpdateBudgetDto } from '../dtos/budget.dto';
import { BudgetResponse, BudgetStatusResponse } from '../dtos/budget.response.dto';

@ApiTags('budgets')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'budgets', version: '1' })
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  @ApiOperation({ summary: 'List all budgets for the current user' })
  @ApiOkResponse({ type: [BudgetResponse] })
  findAll(@CurrentUser() user: { id: string }): Promise<BudgetResponse[]> {
    return this.budgetsService.findAll(user.id);
  }

  @Get('status')
  @ApiOperation({
    summary: 'Budget status — all tags with budgets, current month spending, and % used',
  })
  @ApiOkResponse({ type: [BudgetStatusResponse] })
  getStatus(@CurrentUser() user: { id: string }): Promise<BudgetStatusResponse[]> {
    return this.budgetsService.getStatus(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a budget for a tag' })
  @ApiCreatedResponse({ type: BudgetResponse })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  @ApiResponse({ status: 409, description: 'Budget for this tag already exists' })
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateBudgetDto,
  ): Promise<BudgetResponse> {
    return this.budgetsService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update budget amount' })
  @ApiOkResponse({ type: BudgetResponse })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
  ): Promise<BudgetResponse> {
    return this.budgetsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove budget from a tag' })
  @ApiOkResponse({ description: 'Budget deleted' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  async remove(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    await this.budgetsService.remove(user.id, id);
    return { message: 'Budget deleted' };
  }
}
