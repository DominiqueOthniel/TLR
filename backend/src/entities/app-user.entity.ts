import { Entity, PrimaryColumn, Column } from 'typeorm';

export type AppUserRole = 'admin' | 'pdg' | 'gestion_manager' | 'comptable';

@Entity('app_users')
export class AppUser {
  @PrimaryColumn({ type: 'varchar', length: 30 })
  login: string;

  @Column({ type: 'varchar', length: 64 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 32 })
  role: AppUserRole;
}
