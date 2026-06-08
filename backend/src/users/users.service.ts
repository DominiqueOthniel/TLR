import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AppUser, AppUserRole } from '../entities/app-user.entity';
import { hashPassword } from '../utils/password-hash';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

const DEFAULT_USERS: Array<{ login: string; passwordHash: string; role: AppUserRole }> = [
  { login: 'pdg', passwordHash: '3c7c0c24b79903bae96dc85669cc58d82a0142ca87084ac0958652179de21ad3', role: 'pdg' },
  { login: 'sara', passwordHash: '926b4b8a00cfab44b758450fa6bf188d4bf8541c2fd6b3d9b93d152d43a99f64', role: 'admin' },
  { login: 'hammanwabi', passwordHash: '0892b4377c41d5c3d7d85f2161212e1bd1c57c19b9b446ce8dfea7b7bee8c9c5', role: 'admin' },
];

export interface UserSummaryDto {
  login: string;
  role: AppUserRole;
}

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(AppUser)
    private readonly userRepository: Repository<AppUser>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureUsersTable();
      await this.seedDefaultUsers();
    } catch (err) {
      // Ne bloque pas le démarrage complet de l'API si la base refuse l'initialisation des comptes.
      console.warn('Initialisation des comptes utilisateurs ignorée:', err);
    }
  }

  private normalizeLogin(login: string): string {
    return login.trim().toLowerCase();
  }

  private normalizeRole(role: string): AppUserRole {
    if (role === 'gestionnaire') return 'gestion_manager';
    if (role === 'admin' || role === 'pdg' || role === 'gestion_manager' || role === 'comptable') {
      return role;
    }
    return 'comptable';
  }

  private toSummary(user: AppUser): UserSummaryDto {
    return { login: user.login, role: this.normalizeRole(user.role) };
  }

  private async ensureUsersTable(): Promise<void> {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        login varchar(30) PRIMARY KEY,
        "passwordHash" varchar(64) NOT NULL,
        role varchar(32) NOT NULL
      )
    `);
  }

  private async seedDefaultUsers(): Promise<void> {
    for (const def of DEFAULT_USERS) {
      const existing = await this.userRepository.findOne({ where: { login: def.login } });
      if (!existing) {
        await this.userRepository.save(
          this.userRepository.create({
            login: def.login,
            passwordHash: def.passwordHash,
            role: def.role,
          }),
        );
      }
    }
  }

  async findAll(): Promise<UserSummaryDto[]> {
    const users = await this.userRepository.find({ order: { login: 'ASC' } });
    return users.map((u) => this.toSummary(u));
  }

  async login(dto: LoginUserDto): Promise<UserSummaryDto> {
    const login = this.normalizeLogin(dto.login);
    const user = await this.userRepository.findOne({ where: { login } });
    if (!user) throw new UnauthorizedException('Identifiants incorrects');

    const hash = hashPassword(dto.password);
    if (hash !== user.passwordHash) throw new UnauthorizedException('Identifiants incorrects');

    return this.toSummary(user);
  }

  async create(dto: CreateUserDto): Promise<UserSummaryDto> {
    const login = this.normalizeLogin(dto.login);
    const existing = await this.userRepository.findOne({ where: { login } });
    if (existing) throw new ConflictException('Ce login existe déjà.');

    const user = this.userRepository.create({
      login,
      passwordHash: hashPassword(dto.password),
      role: this.normalizeRole(dto.role),
    });
    const saved = await this.userRepository.save(user);
    return this.toSummary(saved);
  }

  async changePassword(loginInput: string, password: string): Promise<UserSummaryDto> {
    const login = this.normalizeLogin(loginInput);
    const user = await this.userRepository.findOne({ where: { login } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    user.passwordHash = hashPassword(password);
    const saved = await this.userRepository.save(user);
    return this.toSummary(saved);
  }

  async changeOwnPassword(actorLogin: string, currentPassword: string, newPassword: string): Promise<void> {
    const login = this.normalizeLogin(actorLogin);
    const user = await this.userRepository.findOne({ where: { login } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    const currentHash = hashPassword(currentPassword);
    if (currentHash !== user.passwordHash) {
      throw new UnauthorizedException('Mot de passe actuel incorrect.');
    }

    user.passwordHash = hashPassword(newPassword);
    await this.userRepository.save(user);
  }

  async changeRole(loginInput: string, role: AppUserRole): Promise<UserSummaryDto> {
    const login = this.normalizeLogin(loginInput);
    const user = await this.userRepository.findOne({ where: { login } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    const nextRole = this.normalizeRole(role);
    const currentRole = this.normalizeRole(user.role);

    if (currentRole === 'admin' && nextRole !== 'admin') {
      const adminCount = await this.userRepository.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        throw new BadRequestException('Impossible de retirer le rôle du dernier administrateur.');
      }
    }

    user.role = nextRole;
    const saved = await this.userRepository.save(user);
    return this.toSummary(saved);
  }

  async remove(loginInput: string, actorLogin: string): Promise<void> {
    const login = this.normalizeLogin(loginInput);
    const normalizedActor = this.normalizeLogin(actorLogin);
    if (login === normalizedActor) {
      throw new BadRequestException('Impossible de supprimer le compte actuellement connecté.');
    }

    const user = await this.userRepository.findOne({ where: { login } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    if (this.normalizeRole(user.role) === 'admin') {
      const adminCount = await this.userRepository.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        throw new BadRequestException('Impossible de supprimer le dernier administrateur.');
      }
    }

    await this.userRepository.delete({ login });
  }
}
