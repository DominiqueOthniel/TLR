import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateRemboursementDto {
  @IsString()
  date: string;

  @IsNumber()
  @Min(0.01)
  montant: number;

  @IsOptional()
  @IsString()
  note?: string;
}
