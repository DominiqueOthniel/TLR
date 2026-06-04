import { Controller, ForbiddenException, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuditLogsService } from './audit-logs.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  findAll(@Query() query: QueryAuditLogsDto, @Req() req: Request) {
    const rawRole = req.headers['x-actor-role'];
    const role =
      typeof rawRole === 'string'
        ? rawRole.trim().toLowerCase()
        : Array.isArray(rawRole)
          ? String(rawRole[0] ?? '').trim().toLowerCase()
          : '';
    if (role !== 'admin') {
      throw new ForbiddenException('Accès réservé à l’administrateur.');
    }
    return this.auditLogsService.findAll(query);
  }
}

