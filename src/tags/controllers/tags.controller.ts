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
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@lgerma/nestjs-doorkeeper';
import { TagsService } from '../services/tags.service';
import { CreateTagDto, UpdateTagDto } from '../dtos/tag.dto';
import { TagResponse } from '../dtos/tag.response.dto';

@ApiTags('tags')
@ApiBearerAuth('JWT-auth')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOperation({ summary: 'List all tags for the current user' })
  @ApiOkResponse({ type: [TagResponse] })
  findAll(@CurrentUser() user): Promise<TagResponse[]> {
    return this.tagsService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tag' })
  @ApiCreatedResponse({ type: TagResponse })
  @ApiResponse({ status: 409, description: 'Tag name already exists for this user' })
  create(@CurrentUser() user, @Body() dto: CreateTagDto): Promise<TagResponse> {
    return this.tagsService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tag (rename or change color)' })
  @ApiOkResponse({ type: TagResponse })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  update(
    @CurrentUser() user,
    @Param('id') id: string,
    @Body() dto: UpdateTagDto,
  ): Promise<TagResponse> {
    return this.tagsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a tag' })
  @ApiOkResponse({ description: 'Tag deleted' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async remove(@CurrentUser() user, @Param('id') id: string) {
    await this.tagsService.remove(user.id, id);
    return { message: 'Tag deleted' };
  }
}
