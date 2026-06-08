import { IsIn, IsString, Matches, MinLength } from 'class-validator';

const ROLES = ['admin', 'pdg', 'gestion_manager', 'comptable'] as const;

export class CreateUserDto {
  @IsString()
  @Matches(/^[a-z0-9._-]{3,30}$/, {
    message: 'Le login doit contenir 3 à 30 caractères : lettres, chiffres, point, tiret ou underscore.',
  })
  login: string;

  @IsString()
  @IsIn(ROLES)
  role: (typeof ROLES)[number];

  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' })
  password: string;
}
