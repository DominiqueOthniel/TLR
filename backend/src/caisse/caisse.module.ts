import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaisseConfig } from '../entities/caisse-config.entity';
import { CaisseTransactionEntity } from '../entities/caisse-transaction.entity';
import { CaisseController } from './caisse.controller';
import { CaisseService } from './caisse.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([CaisseConfig, CaisseTransactionEntity]), AuditLogsModule],
  controllers: [CaisseController],
  providers: [CaisseService],
  exports: [CaisseService],
})
export class CaisseModule {}
