import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BankAccount } from './bank-account.entity';

export type BankTransactionType = 'depot' | 'retrait' | 'virement' | 'prelevement' | 'frais';

@Entity('bank_transactions')
export class BankTransaction {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  compteId: string;

  @Column({ type: 'varchar', length: 20 })
  type: BankTransactionType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  montant: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  reference?: string;

  @Column({ type: 'varchar', nullable: true })
  beneficiaire?: string;

  @Column({ type: 'varchar', nullable: true })
  categorie?: string;

  @ManyToOne(() => BankAccount, (account) => account.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'compteId' })
  compte: BankAccount;
}
