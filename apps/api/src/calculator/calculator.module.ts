import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { CalculatorController } from './calculator.controller';
import { CalculatorService } from './calculator.service';
import { CALCULATOR_HISTORY_REPOSITORY } from '../persistence/persistence.constants';
import { DatabaseCalculatorHistoryRepository } from '../persistence/database-calculator-history.repository';
import { JsonCalculatorHistoryRepository } from '../persistence/json-calculator-history.repository';
import { PersistenceDriver } from '../persistence/persistence.types';
import { resolveWorkspacePath } from '../common/workspace-path.util';

@Module({
  controllers: [CalculatorController],
  providers: [
    CalculatorService,
    {
      provide: CALCULATOR_HISTORY_REPOSITORY,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const driver =
          configService.get<PersistenceDriver>('PERSISTENCE_DRIVER') ?? 'json';

        if (driver === 'database') {
          const databaseUrl = configService.get<string>('DATABASE_URL');

          if (!databaseUrl) {
            throw new Error(
              'DATABASE_URL is required when PERSISTENCE_DRIVER=database',
            );
          }

          return new DatabaseCalculatorHistoryRepository(
            new Pool({
              connectionString: databaseUrl,
            }),
          );
        }

        const configuredDir =
          configService.get<string>('JSON_STORAGE_DIR') ?? 'temp/data';

        return new JsonCalculatorHistoryRepository(
          resolveWorkspacePath(configuredDir, 'calculator-history.json'),
        );
      },
    },
  ],
})
export class CalculatorModule {}
