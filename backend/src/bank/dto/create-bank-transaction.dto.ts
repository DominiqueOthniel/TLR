import { IsString, IsOptional, IsNumber, IsIn } from 'class-validator';

export class CreateBankTransactionDto {
  @IsString()
  compteId: string;

  @IsString()
  @IsIn(['depot', 'retrait', 'virement', 'prelevement', 'frais'])
  type: 'depot' | 'retrait' | 'virement' | 'prelevement' | 'frais';

  @IsNumber()
  montant: number;

  @IsString()
  date: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  beneficiaire?: string;

  @IsOptional()
  @IsString()
  categorie?: string;
}
