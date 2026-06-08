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

  async create(dto: CreateTripDto): Promise<Trip> {
    const trip = this.tripRepository.create({
      id: uuidv4(),
      ...dto,
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
    await this.tripRepository.update(id, dto as Partial<Trip>);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.tripRepository.delete(id);
  }
}
