import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { BankTransaction } from './bank-transaction.entity';

export type BankAccountType = 'courant' | 'epargne' | 'professionnel';

@Entity('bank_accounts')
export class BankAccount {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  nom: string;

  @Column()
  numeroCompte: string;

  @Column()
  banque: string;

  @Column({ type: 'varchar', length: 20 })
  type: BankAccountType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  soldeInitial: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  soldeActuel: number;

  @Column({ type: 'varchar', length: 10, default: 'FCFA' })
  devise: string;

  @Column({ type: 'varchar', nullable: true })
  iban?: string;

  @Column({ type: 'varchar', nullable: true })
  swift?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany(() => BankTransaction, (tx) => tx.compte)
  transactions: BankTransaction[];
}
