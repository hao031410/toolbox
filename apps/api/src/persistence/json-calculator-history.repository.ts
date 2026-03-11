import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
  CalculatorHistoryRecord,
  CalculatorHistoryRepository,
  CreateCalculatorHistoryInput,
} from './persistence.types';

export class JsonCalculatorHistoryRepository implements CalculatorHistoryRepository {
  constructor(private readonly filePath: string) {}

  async listByDeviceId(deviceId: string): Promise<CalculatorHistoryRecord[]> {
    const records = await this.readAll();
    return records
      .filter((record) => record.deviceId === deviceId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async create(
    input: CreateCalculatorHistoryInput,
  ): Promise<CalculatorHistoryRecord> {
    const records = await this.readAll();
    const record: CalculatorHistoryRecord = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...input,
    };
    const next = [
      record,
      ...records.filter(
        (item) =>
          !(
            item.deviceId === input.deviceId &&
            item.expression === input.expression &&
            item.result === input.result
          ),
      ),
    ].slice(0, 200);
    await this.writeAll(next);
    return record;
  }

  async clearByDeviceId(deviceId: string): Promise<void> {
    const records = await this.readAll();
    await this.writeAll(
      records.filter((record) => record.deviceId !== deviceId),
    );
  }

  private async ensureStorage() {
    await mkdir(dirname(this.filePath), { recursive: true });

    try {
      await readFile(this.filePath, 'utf8');
    } catch {
      await writeFile(this.filePath, '[]', 'utf8');
    }
  }

  private async readAll(): Promise<CalculatorHistoryRecord[]> {
    await this.ensureStorage();
    const content = await readFile(this.filePath, 'utf8');
    const parsed: unknown = JSON.parse(content);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isCalculatorHistoryRecord);
  }

  private async writeAll(records: CalculatorHistoryRecord[]): Promise<void> {
    await this.ensureStorage();
    await writeFile(this.filePath, JSON.stringify(records, null, 2), 'utf8');
  }
}

function isCalculatorHistoryRecord(
  value: unknown,
): value is CalculatorHistoryRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === 'string' &&
    typeof record.deviceId === 'string' &&
    typeof record.expression === 'string' &&
    typeof record.result === 'string' &&
    typeof record.createdAt === 'string'
  );
}
