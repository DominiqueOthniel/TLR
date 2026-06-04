import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

export type InvoiceStatus = 'en_attente' | 'payee';

@Entity('invoices')
@Index('idx_invoices_date_creation', ['dateCreation'])
@Index('idx_invoices_statut', ['statut'])
@Index('idx_invoices_trajet_id', ['trajetId'])
@Index('idx_invoices_parcel_expedition_id', ['parcelExpeditionId'])
export class Invoice {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  numero: string;

  @Column({ type: 'uuid', nullable: true })
  trajetId?: string;

  @Column({ type: 'uuid', nullable: true })
  parcelExpeditionId?: string;

  @Column({ type: 'uuid', nullable: true })
  expenseId?: string;

  @Column({ type: 'varchar', length: 20 })
  statut: InvoiceStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  montantHT: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  remise?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  montantHTApresRemise?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  tva?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  tps?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  montantTTC: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  montantPaye?: number;

  @Column({ type: 'date' })
  dateCreation: string;

  @Column({ type: 'date', nullable: true })
  datePaiement?: string;

  @Column({ type: 'varchar', nullable: true })
  modePaiement?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
