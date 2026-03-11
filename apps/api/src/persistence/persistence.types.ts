export type PersistenceDriver = 'json' | 'database';

export type CalculatorHistoryRecord = {
  id: string;
  deviceId: string;
  expression: string;
  result: string;
  createdAt: string;
};

export type CreateCalculatorHistoryInput = {
  deviceId: string;
  expression: string;
  result: string;
};

export interface CalculatorHistoryRepository {
  listByDeviceId(deviceId: string): Promise<CalculatorHistoryRecord[]>;
  create(input: CreateCalculatorHistoryInput): Promise<CalculatorHistoryRecord>;
  clearByDeviceId(deviceId: string): Promise<void>;
}
