import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { CreditRemboursement } from './credit-remboursement.entity';

export type CreditType = 'emprunt' | 'pret_accorde';
export type CreditStatut = 'en_cours' | 'solde' | 'en_retard';

@Entity('credits')
export class Credit {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  type: CreditType;

  @Column()
  intitule: string;

  @Column()
  preteur: string;

  @Column({ name: 'montantTotal', type: 'decimal', precision: 15, scale: 2 })
  montantTotal: string;

  @Column({ name: 'montantRembourse', type: 'decimal', precision: 15, scale: 2, default: 0 })
  montantRembourse: string;

  @Column({ name: 'tauxInteret', type: 'decimal', precision: 15, scale: 2, nullable: true })
  tauxInteret?: string;

  @Column({ name: 'dateDebut', type: 'date' })
  dateDebut: string;

  @Column({ name: 'dateEcheance', type: 'date', nullable: true })
  dateEcheance?: string;

  @Column({ type: 'varchar', length: 20 })
  statut: CreditStatut;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany(() => CreditRemboursement, (r) => r.credit, { cascade: true })
  remboursements: CreditRemboursement[];
}
