import { IsString, IsOptional, IsNumber, IsIn, ValidateIf } from 'class-validator';

export class CreateTripDto {
  @IsOptional()
  @IsString()
  tracteurId?: string;

  @IsOptional()
  @IsString()
  remorqueuseId?: string;

  @IsString()
  origine: string;

  @IsString()
  destination: string;

  @IsOptional()
  @IsNumber()
  origineLat?: number;

  @IsOptional()
  @IsNumber()
  origineLng?: number;

  @IsOptional()
  @IsNumber()
  destinationLat?: number;

  @IsOptional()
  @IsNumber()
  destinationLng?: number;

  @IsString()
  chauffeurId: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && v !== '')
  @IsString()
  chauffeurRemplacantId?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && v !== '')
  @IsString()
  remplacementDate?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && v !== '')
  @IsString()
  remplacementLieu?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && v !== '')
  @IsString()
  remplacementMotif?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && v !== '')
  @IsNumber()
  recetteChauffeurInitial?: number;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && v !== '')
  @IsNumber()
  recetteChauffeurRemplacant?: number;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && v !== '')
  @IsNumber()
  prefinancementChauffeurInitial?: number;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && v !== '')
  @IsNumber()
  prefinancementChauffeurRemplacant?: number;

  @IsString()
  dateDepart: string;

  @IsOptional()
  @IsString()
  dateArrivee?: string;

  @IsNumber()
  recette: number;

  @IsOptional()
  @IsNumber()
  prefinancement?: number;

  @IsOptional()
  @IsString()
  client?: string;

  @IsOptional()
  @IsString()
  marchandise?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsIn(['planifie', 'en_cours', 'termine', 'annule'])
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule';
}
