import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Trip } from '../entities/trip.entity';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

@Injectable()
export class TripsService implements OnModuleInit {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureTripDetailColumns();
  }

  private async ensureTripDetailColumns(): Promise<void> {
    await this.dataSource.query(`
      ALTER TABLE trips
        ADD COLUMN IF NOT EXISTS quantite decimal(12, 2),
        ADD COLUMN IF NOT EXISTS "prixUnitaire" decimal(15, 2)
    `);
  }

  private normalizeDateOnly(value: string): string;
  private normalizeDateOnly(value: string | undefined | null): string | undefined;
  private normalizeDateOnly(value: string | undefined | null): string | undefined {
    if (!value) return undefined;
    return value.includes('T') ? value.split('T')[0] : value;
  }

  private normalizeNullableDateOnly(value: string | null | undefined): string | null | undefined {
    if (value === null) return null;
    return this.normalizeDateOnly(value);
  }

  async create(dto: CreateTripDto): Promise<Trip> {
    const trip = this.tripRepository.create({
      id: uuidv4(),
      ...dto,
      dateDepart: this.normalizeDateOnly(dto.dateDepart),
      dateArrivee: this.normalizeDateOnly(dto.dateArrivee),
      remplacementDate: this.normalizeDateOnly(dto.remplacementDate),
    });
    return this.tripRepository.save(trip);
  }

  async findAll(): Promise<Trip[]> {
    return this.tripRepository.find({
      order: { dateDepart: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id },
      relations: ['tracteur', 'remorqueuse', 'chauffeur', 'chauffeurRemplacant'],
    });
    if (!trip) throw new NotFoundException(`Trajet ${id} introuvable`);
    return trip;
  }

  async update(id: string, dto: UpdateTripDto): Promise<Trip> {
    await this.findOne(id);
    const patch = {
      ...dto,
      ...(dto.dateDepart !== undefined ? { dateDepart: this.normalizeDateOnly(dto.dateDepart) } : {}),
      ...(dto.dateArrivee !== undefined ? { dateArrivee: this.normalizeNullableDateOnly(dto.dateArrivee) } : {}),
      ...(dto.remplacementDate !== undefined ? { remplacementDate: this.normalizeNullableDateOnly(dto.remplacementDate) } : {}),
    };
    await this.tripRepository.update(id, patch as Partial<Trip>);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.tripRepository.delete(id);
  }
}
