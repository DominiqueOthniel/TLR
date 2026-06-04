import { IsString, IsOptional, IsNumber, IsIn } from 'class-validator';

export class CreateBankAccountDto {
  @IsString()
  nom: string;

  @IsString()
  numeroCompte: string;

  @IsString()
  banque: string;

  @IsString()
  @IsIn(['courant', 'epargne', 'professionnel'])
  type: 'courant' | 'epargne' | 'professionnel';

  @IsNumber()
  soldeInitial: number;

  @IsOptional()
  @IsString()
  devise?: string;

  @IsOptional()
  @IsString()
  iban?: string;

  @IsOptional()
  @IsString()
  swift?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
