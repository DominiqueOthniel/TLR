import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { LoginUserDto } from './dto/login-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangeOwnPasswordDto, ChangePasswordDto } from './dto/change-password.dto';
import { ChangeRoleDto } from './dto/change-role.dto';

function getActorRole(req: Request): string {
  const raw = req.headers['x-actor-role'];
  if (typeof raw === 'string') return raw.trim().toLowerCase();
  if (Array.isArray(raw)) return String(raw[0] ?? '').trim().toLowerCase();
  return '';
}

function getActorLogin(req: Request): string {
  const raw = req.headers['x-actor-login'];
  if (typeof raw === 'string') return raw.trim().toLowerCase();
  if (Array.isArray(raw)) return String(raw[0] ?? '').trim().toLowerCase();
  return '';
}

function assertAdmin(req: Request): void {
  if (getActorRole(req) !== 'admin') {
    throw new ForbiddenException('Action réservée à l’administrateur.');
  }
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post('login')
  login(@Body() dto: LoginUserDto) {
    return this.usersService.login(dto);
  }

  @Post()
  create(@Body() dto: CreateUserDto, @Req() req: Request) {
    assertAdmin(req);
    return this.usersService.create(dto);
  }

  @Patch('me/password')
  async changeOwnPassword(@Body() dto: ChangeOwnPasswordDto, @Req() req: Request) {
    const actorLogin = getActorLogin(req);
    if (!actorLogin) {
      throw new ForbiddenException('Utilisateur non identifié.');
    }
    await this.usersService.changeOwnPassword(actorLogin, dto.currentPassword, dto.newPassword);
    return { message: 'Mot de passe mis à jour.' };
  }

  @Patch(':login/password')
  changePassword(
    @Param('login') login: string,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    assertAdmin(req);
    return this.usersService.changePassword(login, dto.password);
  }

  @Patch(':login/role')
  changeRole(
    @Param('login') login: string,
    @Body() dto: ChangeRoleDto,
    @Req() req: Request,
  ) {
    assertAdmin(req);
    return this.usersService.changeRole(login, dto.role);
  }

  @Delete(':login')
  async remove(@Param('login') login: string, @Req() req: Request) {
    assertAdmin(req);
    const actorLogin = getActorLogin(req);
    if (!actorLogin) {
      throw new ForbiddenException('Utilisateur non identifié.');
    }
    await this.usersService.remove(login, actorLogin);
    return { message: 'Utilisateur supprimé.' };
  }
}
