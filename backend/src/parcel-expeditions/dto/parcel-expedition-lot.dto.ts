import { IsString, IsOptional, IsNumber, MinLength, Min } from 'class-validator';

export class ParcelExpeditionLotDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MinLength(1, { message: 'Chaque ligne doit indiquer le ou les clients' })
  clients: string;

  @IsString()
  @MinLength(1, { message: 'Chaque ligne doit indiquer une unité (ex. cartons, sacs)' })
  unite: string;

  @IsNumber()
  @Min(0.01, { message: 'La quantité doit être supérieure à 0' })
  quantite: number;

  @IsNumber()
  @Min(0, { message: 'Le prix unitaire ne peut pas être négatif' })
  prixUnitaire: number;

  @IsOptional()
  @IsNumber()
  montant?: number;

  @IsOptional()
  @IsString()
  observations?: string;
}
