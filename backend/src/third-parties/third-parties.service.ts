import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ThirdParty } from '../entities/third-party.entity';
import { CreateThirdPartyDto } from './dto/create-third-party.dto';
import { UpdateThirdPartyDto } from './dto/update-third-party.dto';

@Injectable()
export class ThirdPartiesService {
  constructor(
    @InjectRepository(ThirdParty)
    private readonly thirdPartyRepository: Repository<ThirdParty>,
  ) {}

  async create(dto: CreateThirdPartyDto): Promise<ThirdParty> {
    const thirdParty = this.thirdPartyRepository.create({
      id: uuidv4(),
      ...dto,
    });
    return this.thirdPartyRepository.save(thirdParty);
  }

  async findAll(): Promise<ThirdParty[]> {
    return this.thirdPartyRepository.find({
      order: { nom: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ThirdParty> {
    const thirdParty = await this.thirdPartyRepository.findOne({ where: { id } });
    if (!thirdParty) throw new NotFoundException(`Tier ${id} introuvable`);
    return thirdParty;
  }

  async update(id: string, dto: UpdateThirdPartyDto): Promise<ThirdParty> {
    await this.findOne(id);
    await this.thirdPartyRepository.update(id, dto as Partial<ThirdParty>);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.thirdPartyRepository.delete(id);
  }
}
