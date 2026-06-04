import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Credit } from '../entities/credit.entity';
import { CreditRemboursement } from '../entities/credit-remboursement.entity';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Credit, CreditRemboursement]), AuditLogsModule],
  controllers: [CreditsController],
  providers: [CreditsService],
  exports: [CreditsService],
})
export class CreditsModule {}
