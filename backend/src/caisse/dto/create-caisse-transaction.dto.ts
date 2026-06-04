import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCaisseTransactionDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsIn(['entree', 'sortie'])
  type: 'entree' | 'sortie';

  @IsNumber()
  @Min(0.01)
  montant: number;

  @IsString()
  date: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  utilisateur?: string;

  @IsOptional()
  @IsString()
  categorie?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  compteBanqueId?: string;

  @IsOptional()
  @IsString()
  bankTransactionId?: string;

  @IsOptional()
  @IsBoolean()
  exclutRevenu?: boolean;
}
