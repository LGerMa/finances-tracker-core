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
import { PaymentSourceService } from '../services/payment-sources.service';
import {
  CreatePaymentSourceDto,
  UpdatePaymentSourceDto,
} from '../dtos/payment-source.dto';
import { PaymentSourceResponse } from '../dtos/payment-source.response.dto';

@ApiTags('payment-sources')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'payment-sources', version: '1' })
export class PaymentSourcesController {
  constructor(private readonly paymentSourceService: PaymentSourceService) {}

  @Get()
  @ApiOperation({ summary: 'List payment sources for the current user' })
  @ApiOkResponse({ type: [PaymentSourceResponse] })
  findAll(
    @CurrentUser() user: { id: string },
  ): Promise<PaymentSourceResponse[]> {
    return this.paymentSourceService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a payment source' })
  @ApiCreatedResponse({ type: PaymentSourceResponse })
  @ApiResponse({
    status: 409,
    description: 'Alias already exists for this user',
  })
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreatePaymentSourceDto,
  ): Promise<PaymentSourceResponse> {
    return this.paymentSourceService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a payment source' })
  @ApiOkResponse({ type: PaymentSourceResponse })
  @ApiResponse({ status: 404, description: 'Payment source not found' })
  @ApiResponse({
    status: 409,
    description: 'Alias already exists for this user',
  })
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdatePaymentSourceDto,
  ): Promise<PaymentSourceResponse> {
    return this.paymentSourceService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a payment source' })
  @ApiOkResponse({ description: 'Payment source deleted' })
  @ApiResponse({ status: 404, description: 'Payment source not found' })
  async remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    await this.paymentSourceService.remove(user.id, id);
    return { message: 'Payment source deleted' };
  }
}
