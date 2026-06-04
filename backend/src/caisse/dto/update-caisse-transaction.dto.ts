import { PartialType } from '@nestjs/mapped-types';
import { CreateCaisseTransactionDto } from './create-caisse-transaction.dto';

export class UpdateCaisseTransactionDto extends PartialType(CreateCaisseTransactionDto) {}
