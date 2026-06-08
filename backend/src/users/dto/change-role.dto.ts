import { IsIn, IsString } from 'class-validator';

const ROLES = ['admin', 'pdg', 'gestion_manager', 'comptable'] as const;

export class ChangeRoleDto {
  @IsString()
  @IsIn(ROLES)
  role: (typeof ROLES)[number];
}
