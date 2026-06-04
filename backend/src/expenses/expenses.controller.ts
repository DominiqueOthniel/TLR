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
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  private getActor(req: Request): { login?: string; role?: string } {
    const login = req.headers['x-actor-login'];
    const role = req.headers['x-actor-role'];
    return {
      login: typeof login === 'string' ? login : undefined,
      role: typeof role === 'string' ? role : undefined,
    };
  }

  @Post()
  create(@Body() createExpenseDto: CreateExpenseDto, @Req() req: Request) {
    return this.expensesService.create(createExpenseDto, this.getActor(req));
  }

  @Get()
  findAll() {
    return this.expensesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.expensesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Req() req: Request,
  ) {
    return this.expensesService.update(id, updateExpenseDto, this.getActor(req));
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request): Promise<void> {
    await this.expensesService.remove(id, this.getActor(req));
  }
}
