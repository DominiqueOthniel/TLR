import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Personnel } from '../entities/personnel.entity';
import { CreatePersonnelDto } from './dto/create-personnel.dto';
import { UpdatePersonnelDto } from './dto/update-personnel.dto';

@Injectable()
export class PersonnelService {
  constructor(
    @InjectRepository(Personnel)
    private readonly personnelRepository: Repository<Personnel>,
  ) {}

  async create(dto: CreatePersonnelDto): Promise<Personnel> {
    const personnel = this.personnelRepository.create({
      id: uuidv4(),
      statut: dto.statut ?? 'actif',
      ...dto,
    });
    return this.personnelRepository.save(personnel);
  }

  async findAll(): Promise<Personnel[]> {
    return this.personnelRepository.find({
      order: { nom: 'ASC', prenom: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Personnel> {
    const personnel = await this.personnelRepository.findOne({ where: { id } });
    if (!personnel) throw new NotFoundException(`Personnel ${id} introuvable`);
    return personnel;
  }

  async update(id: string, dto: UpdatePersonnelDto): Promise<Personnel> {
    await this.findOne(id);
    await this.personnelRepository.update(id, dto as Partial<Personnel>);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.personnelRepository.delete(id);
  }
}
