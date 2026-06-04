import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CaisseService } from './caisse.service';
import { CreateCaisseTransactionDto } from './dto/create-caisse-transaction.dto';
import { UpdateCaisseTransactionDto } from './dto/update-caisse-transaction.dto';
import { UpdateCaisseConfigDto } from './dto/update-caisse-config.dto';

@Controller('caisse')
export class CaisseController {
  constructor(private readonly caisseService: CaisseService) {}

  private getActor(req: Request): { login?: string; role?: string } {
    const login = req.headers['x-actor-login'];
    const role = req.headers['x-actor-role'];
    return {
      login: typeof login === 'string' ? login : undefined,
      role: typeof role === 'string' ? role : undefined,
    };
  }

  @Get('config')
  getConfig() {
    return this.caisseService.getConfig();
  }

  @Patch('config')
  updateConfig(@Body() dto: UpdateCaisseConfigDto) {
    return this.caisseService.updateConfig(dto);
  }

  @Get('balance')
  getBalance() {
    return this.caisseService.getBalance();
  }

  /** Chemins littéraux avant `transactions/:id` pour éviter qu’un segment soit pris pour un paramètre. */
  @Get('transactions')
  findAllTransactions() {
    return this.caisseService.findAllTransactions();
  }

  @Post('transactions/upsert-by-reference')
  upsertByReference(
    @Query('reference') reference: string,
    @Body() dto: CreateCaisseTransactionDto,
    @Req() req: Request,
  ) {
    if (!reference) {
      return this.caisseService.create(dto, this.getActor(req));
    }
    return this.caisseService.upsertByReference(reference, { ...dto, reference }, this.getActor(req));
  }

  @Delete('transactions/by-reference')
  @HttpCode(204)
  async removeByReference(@Query('reference') reference: string): Promise<void> {
    if (reference) await this.caisseService.removeByReference(reference);
  }

  @Post('transactions')
  createTransaction(@Body() dto: CreateCaisseTransactionDto, @Req() req: Request) {
    return this.caisseService.create(dto, this.getActor(req));
  }

  @Patch('transactions/:id')
  updateTransaction(
    @Param('id') id: string,
    @Body() dto: UpdateCaisseTransactionDto,
    @Req() req: Request,
  ) {
    return this.caisseService.update(id, dto, this.getActor(req));
  }

  @Delete('transactions/:id')
  @HttpCode(204)
  async removeTransaction(@Param('id') id: string, @Req() req: Request): Promise<void> {
    await this.caisseService.remove(id, this.getActor(req));
  }
}
