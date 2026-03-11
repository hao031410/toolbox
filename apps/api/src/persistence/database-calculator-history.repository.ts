import { randomUUID } from 'node:crypto';
import {
  CalculatorHistoryRecord,
  CalculatorHistoryRepository,
  CreateCalculatorHistoryInput,
} from './persistence.types';
import { Pool } from 'pg';

type DatabaseHistoryRow = {
  id: string;
  device_id: string;
  expression: string;
  result: string;
  created_at: Date;
};

export class DatabaseCalculatorHistoryRepository implements CalculatorHistoryRepository {
  constructor(private readonly pool: Pool) {}

  async listByDeviceId(deviceId: string): Promise<CalculatorHistoryRecord[]> {
    await this.ensureTable();
    const result = (await this.pool.query(
      `select id, device_id, expression, result, created_at
       from calculator_history
       where device_id = $1
       order by created_at desc
       limit 50`,
      [deviceId],
    )) as { rows: DatabaseHistoryRow[] };

    return result.rows.map((record) => ({
      id: record.id,
      deviceId: record.device_id,
      expression: record.expression,
      result: record.result,
      createdAt: record.created_at.toISOString(),
    }));
  }

  async create(
    input: CreateCalculatorHistoryInput,
  ): Promise<CalculatorHistoryRecord> {
    await this.ensureTable();
    const id = randomUUID();
    const result = (await this.pool.query(
      `insert into calculator_history (id, device_id, expression, result)
       values ($1, $2, $3, $4)
       returning id, device_id, expression, result, created_at`,
      [id, input.deviceId, input.expression, input.result],
    )) as { rows: DatabaseHistoryRow[] };
    const record = result.rows[0];

    return {
      id: record.id,
      deviceId: record.device_id,
      expression: record.expression,
      result: record.result,
      createdAt: record.created_at.toISOString(),
    };
  }

  async clearByDeviceId(deviceId: string): Promise<void> {
    await this.ensureTable();
    await this.pool.query(
      `delete from calculator_history where device_id = $1`,
      [deviceId],
    );
  }

  private async ensureTable() {
    await this.pool.query(`
      create table if not exists calculator_history (
        id text primary key,
        device_id text not null,
        expression text not null,
        result text not null,
        created_at timestamptz not null default now()
      )
    `);
  }
}
