import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { CALCULATOR_HISTORY_REPOSITORY } from './persistence.constants';
import { DatabaseCalculatorHistoryRepository } from './database-calculator-history.repository';
import { JsonCalculatorHistoryRepository } from './json-calculator-history.repository';
import { PersistenceDriver } from './persistence.types';
import { resolveWorkspacePath } from '../common/workspace-path.util';

@Module({
  providers: [
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
        const filePath = resolveWorkspacePath(
          configuredDir,
          'calculator-history.json',
        );

        return new JsonCalculatorHistoryRepository(filePath);
      },
    },
  ],
  exports: [CALCULATOR_HISTORY_REPOSITORY],
})
export class PersistenceModule {}
