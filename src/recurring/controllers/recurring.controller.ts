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
import { RecurringService } from '../services/recurring.service';
import { CreateRecurringDto, UpdateRecurringDto } from '../dtos/recurring.dto';
import { RecurringEntryResponse } from '../dtos/recurring.response.dto';

@ApiTags('recurring')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'recurring', version: '1' })
export class RecurringController {
  constructor(private readonly recurringService: RecurringService) {}

  @Get()
  @ApiOperation({ summary: 'List all recurring entries for the current user' })
  @ApiOkResponse({ type: [RecurringEntryResponse] })
  findAll(
    @CurrentUser() user: { id: string },
  ): Promise<RecurringEntryResponse[]> {
    return this.recurringService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a recurring entry' })
  @ApiCreatedResponse({ type: RecurringEntryResponse })
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateRecurringDto,
  ): Promise<RecurringEntryResponse> {
    return this.recurringService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a recurring entry' })
  @ApiOkResponse({ type: RecurringEntryResponse })
  @ApiResponse({ status: 404, description: 'Recurring entry not found' })
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateRecurringDto,
  ): Promise<RecurringEntryResponse> {
    return this.recurringService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a recurring entry' })
  @ApiOkResponse({ description: 'Recurring entry deleted' })
  @ApiResponse({ status: 404, description: 'Recurring entry not found' })
  async remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    await this.recurringService.remove(user.id, id);
    return { message: 'Recurring entry deleted' };
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a recurring entry' })
  @ApiOkResponse({ type: RecurringEntryResponse })
  @ApiResponse({ status: 404, description: 'Recurring entry not found' })
  pause(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ): Promise<RecurringEntryResponse> {
    return this.recurringService.pause(user.id, id);
  }

  @Post(':id/resume')
  @ApiOperation({
    summary: 'Resume a recurring entry (recalculates next_date)',
  })
  @ApiOkResponse({ type: RecurringEntryResponse })
  @ApiResponse({ status: 404, description: 'Recurring entry not found' })
  resume(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ): Promise<RecurringEntryResponse> {
    return this.recurringService.resume(user.id, id);
  }
}
