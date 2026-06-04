import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Truck } from './truck.entity';
import { Driver } from './driver.entity';

export type TripStatus = 'planifie' | 'en_cours' | 'termine' | 'annule';

@Entity('trips')
@Index('idx_trips_date_depart', ['dateDepart'])
@Index('idx_trips_chauffeur_id', ['chauffeurId'])
@Index('idx_trips_statut', ['statut'])
export class Trip {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  tracteurId?: string;

  @Column({ type: 'uuid', nullable: true })
  remorqueuseId?: string;

  @Column()
  origine: string;

  @Column()
  destination: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  origineLat?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  origineLng?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  destinationLat?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  destinationLng?: number;

  @Column({ type: 'uuid' })
  chauffeurId: string;

  @Column({ type: 'uuid', nullable: true })
  chauffeurRemplacantId?: string;

  @Column({ type: 'date', nullable: true })
  remplacementDate?: string;

  @Column({ type: 'varchar', nullable: true })
  remplacementLieu?: string;

  @Column({ type: 'text', nullable: true })
  remplacementMotif?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  recetteChauffeurInitial?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  recetteChauffeurRemplacant?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  prefinancementChauffeurInitial?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  prefinancementChauffeurRemplacant?: number;

  @Column({ type: 'date' })
  dateDepart: string;

  @Column({ type: 'date', nullable: true })
  dateArrivee?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  recette: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  prefinancement?: number;

  @Column({ type: 'varchar', nullable: true })
  client?: string;

  @Column({ type: 'varchar', nullable: true })
  marchandise?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 20 })
  statut: TripStatus;

  @ManyToOne(() => Truck, { nullable: true })
  @JoinColumn({ name: 'tracteurId' })
  tracteur?: Truck;

  @ManyToOne(() => Truck, { nullable: true })
  @JoinColumn({ name: 'remorqueuseId' })
  remorqueuse?: Truck;

  @ManyToOne(() => Driver)
  @JoinColumn({ name: 'chauffeurId' })
  chauffeur: Driver;

  @ManyToOne(() => Driver, { nullable: true })
  @JoinColumn({ name: 'chauffeurRemplacantId' })
  chauffeurRemplacant?: Driver;
}
