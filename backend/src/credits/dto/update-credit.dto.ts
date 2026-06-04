import { PartialType } from '@nestjs/mapped-types';
import { CreateCreditDto } from './create-credit.dto';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateCreditDto extends PartialType(CreateCreditDto) {
  @IsOptional()
  @IsNumber()
  @Min(0)
  montantRembourse?: number;

  @IsOptional()
  @IsString()
  @IsIn(['en_cours', 'solde', 'en_retard'])
  statut?: 'en_cours' | 'solde' | 'en_retard';
}
