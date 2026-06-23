import { Body, Controller, Get, HttpCode, Post, Res } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  getHello(): { name: string; version: string; api: string } {
    return {
      name: 'Transport Logistique et Revolution API',
      version: '1.0.0',
      api: '/api',
    };
  }

  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  @Get('admin/backup')
  async backup(@Res() res: Response): Promise<void> {
    const [
      thirdParties,
      personnel,
      drivers,
      driverTransactions,
      trucks,
      trips,
      expenses,
      invoices,
      bankAccounts,
      bankTransactions,
      parcelExpeditions,
      appUsers,
    ] = await Promise.all([
      this.dataSource.query('SELECT * FROM third_parties'),
      this.dataSource.query('SELECT * FROM personnel'),
      this.dataSource.query('SELECT * FROM drivers'),
      this.dataSource.query('SELECT * FROM driver_transactions ORDER BY date ASC'),
      this.dataSource.query('SELECT * FROM trucks'),
      this.dataSource.query('SELECT * FROM trips'),
      this.dataSource.query('SELECT * FROM expenses ORDER BY date ASC'),
      this.dataSource.query('SELECT * FROM invoices'),
      this.dataSource.query('SELECT * FROM bank_accounts'),
      this.dataSource.query('SELECT * FROM bank_transactions ORDER BY date ASC'),
      this.dataSource.query('SELECT * FROM parcel_expeditions ORDER BY "dateDepart" DESC'),
      this.dataSource.query('SELECT * FROM app_users ORDER BY login ASC'),
    ]);

    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        thirdParties,
        personnel,
        drivers,
        driverTransactions,
        trucks,
        trips,
        expenses,
        invoices,
        bankAccounts,
        bankTransactions,
        parcelExpeditions,
        appUsers,
      },
    };

    const filename = `transport-logistique-revolution-backup-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(backup, null, 2));
  }

  @Post('admin/restore')
  @HttpCode(200)
  async restore(@Body() body: any): Promise<{ message: string; counts: Record<string, number> }> {
    const { data } = body;
    if (!data) throw new Error('Corps invalide : propriété "data" manquante');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Vider les tables dans l'ordre des dépendances
      await queryRunner.query(`
        TRUNCATE TABLE
          invoices, expenses, trips, parcel_expeditions,
          driver_transactions, bank_transactions, bank_accounts,
          trucks, personnel, drivers, third_parties, app_users
        RESTART IDENTITY CASCADE
      `);

      // Réinsérer dans l'ordre (respecter les FK)
      const insert = async (table: string, rows: any[]) => {
        if (!rows?.length) return;
        for (const row of rows) {
          const cols = Object.keys(row).map(k => `"${k}"`).join(', ');
          const vals = Object.keys(row).map((_, i) => `$${i + 1}`).join(', ');
          await queryRunner.query(
            `INSERT INTO ${table} (${cols}) VALUES (${vals}) ON CONFLICT (id) DO NOTHING`,
            Object.values(row),
          );
        }
      };

      await insert('third_parties', data.thirdParties);
      await insert('personnel', data.personnel);
      await insert('drivers', data.drivers);
      await insert('driver_transactions', data.driverTransactions);
      await insert('trucks', data.trucks);
      await insert('trips', data.trips);
      await insert('parcel_expeditions', data.parcelExpeditions);
      await insert('expenses', data.expenses);
      await insert('invoices', data.invoices);
      await insert('bank_accounts', data.bankAccounts);
      await insert('bank_transactions', data.bankTransactions);
      if (data.appUsers?.length) {
        for (const row of data.appUsers) {
          if (!row?.login) continue;
          await queryRunner.query(
            `INSERT INTO app_users (login, "passwordHash", role) VALUES ($1, $2, $3) ON CONFLICT (login) DO NOTHING`,
            [row.login, row.passwordHash, row.role],
          );
        }
      }

      await queryRunner.commitTransaction();

      return {
        message: 'Restauration réussie',
        counts: {
          thirdParties: data.thirdParties?.length ?? 0,
          personnel: data.personnel?.length ?? 0,
          drivers: data.drivers?.length ?? 0,
          trucks: data.trucks?.length ?? 0,
          trips: data.trips?.length ?? 0,
          expenses: data.expenses?.length ?? 0,
          invoices: data.invoices?.length ?? 0,
          bankAccounts: data.bankAccounts?.length ?? 0,
          bankTransactions: data.bankTransactions?.length ?? 0,
          parcelExpeditions: data.parcelExpeditions?.length ?? 0,
          appUsers: data.appUsers?.length ?? 0,
        },
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
