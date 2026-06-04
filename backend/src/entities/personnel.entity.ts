import { Column, Entity, PrimaryColumn } from 'typeorm';

export type PersonnelType = 'stagiaire' | 'employe';
export type PersonnelStatus = 'actif' | 'inactif';

@Entity('personnel')
export class Personnel {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column({ type: 'varchar', nullable: true })
  telephone?: string;

  @Column({ type: 'varchar', nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 20 })
  type: PersonnelType;

  @Column({ type: 'varchar', nullable: true })
  poste?: string;

  @Column({ type: 'varchar', length: 20, default: 'actif' })
  statut: PersonnelStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  salaireMensuel?: number;

  @Column({ type: 'date', nullable: true })
  dateEmbauche?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
