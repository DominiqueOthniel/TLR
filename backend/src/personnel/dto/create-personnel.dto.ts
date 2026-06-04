import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePersonnelDto {
  @IsString()
  nom: string;

  @IsString()
  prenom: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsString()
  @IsIn(['stagiaire', 'employe'])
  type: 'stagiaire' | 'employe';

  @IsOptional()
  @IsString()
  poste?: string;

  @IsOptional()
  @IsString()
  @IsIn(['actif', 'inactif'])
  statut?: 'actif' | 'inactif';

  @IsOptional()
  @IsNumber()
  salaireMensuel?: number;

  @IsOptional()
  @IsString()
  dateEmbauche?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
