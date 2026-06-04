import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Credit } from './credit.entity';

@Entity('credit_remboursements')
export class CreditRemboursement {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'creditId', type: 'uuid' })
  creditId: string;

  @ManyToOne(() => Credit, (c) => c.remboursements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creditId' })
  credit: Credit;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  montant: string;

  @Column({ type: 'text', nullable: true })
  note?: string;
}
