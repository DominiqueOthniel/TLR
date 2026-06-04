import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CreditsService } from './credits.service';
import { CreateCreditDto } from './dto/create-credit.dto';
import { UpdateCreditDto } from './dto/update-credit.dto';
import { CreateRemboursementDto } from './dto/create-remboursement.dto';

@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  private getActor(req: Request): { login?: string; role?: string } {
    const login = req.headers['x-actor-login'];
    const role = req.headers['x-actor-role'];
    return {
      login: typeof login === 'string' ? login : undefined,
      role: typeof role === 'string' ? role : undefined,
    };
  }

  @Get()
  findAll() {
    return this.creditsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.creditsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCreditDto, @Req() req: Request) {
    return this.creditsService.create(dto, this.getActor(req));
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCreditDto, @Req() req: Request) {
    return this.creditsService.update(id, dto, this.getActor(req));
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request): Promise<void> {
    await this.creditsService.remove(id, this.getActor(req));
  }

  @Post(':id/remboursements')
  addRemboursement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateRemboursementDto,
    @Req() req: Request,
  ) {
    return this.creditsService.addRemboursement(id, dto, this.getActor(req));
  }
}
