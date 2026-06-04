import { PartialType } from '@nestjs/mapped-types';
import { CreateBankTransactionDto } from './create-bank-transaction.dto';

export class UpdateBankTransactionDto extends PartialType(CreateBankTransactionDto) {}
