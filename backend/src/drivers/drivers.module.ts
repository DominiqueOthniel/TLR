import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Driver } from '../entities/driver.entity';
import { DriverTransaction } from '../entities/driver-transaction.entity';
import { Trip } from '../entities/trip.entity';
import { Expense } from '../entities/expense.entity';
import { ParcelExpedition } from '../entities/parcel-expedition.entity';
import { Truck } from '../entities/truck.entity';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Driver,
      DriverTransaction,
      Trip,
      Expense,
      ParcelExpedition,
      Truck,
    ]),
  ],
  controllers: [DriversController],
  providers: [DriversService],
  exports: [DriversService],
})
export class DriversModule {}
