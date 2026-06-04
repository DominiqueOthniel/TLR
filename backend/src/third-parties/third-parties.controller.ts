import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
} from '@nestjs/common';
import { ThirdPartiesService } from './third-parties.service';
import { CreateThirdPartyDto } from './dto/create-third-party.dto';
import { UpdateThirdPartyDto } from './dto/update-third-party.dto';

@Controller('third-parties')
export class ThirdPartiesController {
  constructor(private readonly thirdPartiesService: ThirdPartiesService) {}

  @Post()
  create(@Body() createThirdPartyDto: CreateThirdPartyDto) {
    return this.thirdPartiesService.create(createThirdPartyDto);
  }

  @Get()
  findAll() {
    return this.thirdPartiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.thirdPartiesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateThirdPartyDto: UpdateThirdPartyDto,
  ) {
    return this.thirdPartiesService.update(id, updateThirdPartyDto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.thirdPartiesService.remove(id);
  }
}
