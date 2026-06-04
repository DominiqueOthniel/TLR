import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Driver } from '../entities/driver.entity';
import { DriverTransaction } from '../entities/driver-transaction.entity';
import { Trip } from '../entities/trip.entity';
import { Expense } from '../entities/expense.entity';
import { ParcelExpedition } from '../entities/parcel-expedition.entity';
import { Truck } from '../entities/truck.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { uploadImageFromDataUrl } from '../utils/supabase-upload';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(DriverTransaction)
    private readonly transactionRepository: Repository<DriverTransaction>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(ParcelExpedition)
    private readonly parcelExpeditionRepository: Repository<ParcelExpedition>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
  ) {}

  async create(dto: CreateDriverDto): Promise<Driver> {
    const id = uuidv4();

    let photo = dto.photo;
    if (dto.photo?.startsWith('data:image/')) {
      const bucket = process.env.SUPABASE_BUCKET_DRIVERS || 'driver-photos';
      const path = `drivers/${id}`;
      photo = await uploadImageFromDataUrl(bucket, path, dto.photo);
    }

    const driver = this.driverRepository.create({
      id,
      nom: dto.nom,
      prenom: dto.prenom,
      telephone: dto.telephone,
      cni: dto.cni,
      numeroPermis: dto.numeroPermis,
      numeroCompteBancaire: dto.numeroCompteBancaire,
      photo,
    });
    const saved = await this.driverRepository.save(driver);
    if (dto.transactions?.length) {
      const transactions = dto.transactions.map((t) =>
        this.transactionRepository.create({
          id: uuidv4(),
          ...t,
          driverId: saved.id,
        }),
      );
      await this.transactionRepository.save(transactions);
    }
    return this.findOne(saved.id);
  }

  async findAll(): Promise<Driver[]> {
    return this.driverRepository.find({
      relations: ['transactions'],
      order: { nom: 'ASC', prenom: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { id },
      relations: ['transactions'],
    });
    if (!driver) throw new NotFoundException(`Chauffeur ${id} introuvable`);
    return driver;
  }

  async update(id: string, dto: UpdateDriverDto): Promise<Driver> {
    await this.findOne(id);
    const { transactions, ...rest } = dto;
    let patch: Partial<Driver> = rest as Partial<Driver>;

    if (dto.photo && dto.photo.startsWith('data:image/')) {
      const bucket = process.env.SUPABASE_BUCKET_DRIVERS || 'driver-photos';
      const path = `drivers/${id}`;
      const uploaded = await uploadImageFromDataUrl(bucket, path, dto.photo);
      patch = { ...patch, photo: uploaded };
    }

    await this.driverRepository.update(id, patch);
    return this.findOne(id);
  }

  private async getDriverDeletionBlockers(id: string): Promise<string[]> {
    const [tripsCount, expensesCount, expeditionsCount, trucksCount] =
      await Promise.all([
        this.tripRepository.count({
          where: [{ chauffeurId: id }, { chauffeurRemplacantId: id }],
        }),
        this.expenseRepository.count({ where: { chauffeurId: id } }),
        this.parcelExpeditionRepository.count({ where: { chauffeurId: id } }),
        this.truckRepository.count({ where: { chauffeurId: id } }),
      ]);

    const blockers: string[] = [];
    if (tripsCount > 0) {
      blockers.push(`${tripsCount} trajet${tripsCount > 1 ? 's' : ''}`);
    }
    if (expensesCount > 0) {
      blockers.push(`${expensesCount} dépense${expensesCount > 1 ? 's' : ''}`);
    }
    if (expeditionsCount > 0) {
      blockers.push(
        `${expeditionsCount} expédition${expeditionsCount > 1 ? 's' : ''} colis`,
      );
    }
    if (trucksCount > 0) {
      blockers.push(`${trucksCount} camion${trucksCount > 1 ? 's' : ''}`);
    }
    return blockers;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    const blockers = await this.getDriverDeletionBlockers(id);
    if (blockers.length > 0) {
      throw new ConflictException(
        `Impossible de supprimer ce chauffeur : il est encore lié à ${blockers.join(', ')}. Modifiez ou supprimez ces enregistrements avant de réessayer.`,
      );
    }

    try {
      await this.transactionRepository.delete({ driverId: id });
      await this.driverRepository.delete(id);
    } catch (err) {
      if (err instanceof QueryFailedError && (err as { code?: string }).code === '23503') {
        throw new ConflictException(
          'Impossible de supprimer ce chauffeur : il est encore référencé par d\'autres enregistrements. Modifiez ou supprimez ces liens avant de réessayer.',
        );
      }
      throw err;
    }
  }
}
