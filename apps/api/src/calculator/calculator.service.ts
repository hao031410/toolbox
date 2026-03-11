import { Inject, Injectable } from '@nestjs/common';
import { CALCULATOR_HISTORY_REPOSITORY } from '../persistence/persistence.constants';
import { CreateCalculatorHistoryInput } from '../persistence/persistence.types';
import type { CalculatorHistoryRepository } from '../persistence/persistence.types';

@Injectable()
export class CalculatorService {
  constructor(
    @Inject(CALCULATOR_HISTORY_REPOSITORY)
    private readonly historyRepository: CalculatorHistoryRepository,
  ) {}

  listHistories(deviceId: string) {
    return this.historyRepository.listByDeviceId(deviceId);
  }

  createHistory(input: CreateCalculatorHistoryInput) {
    return this.historyRepository.create(input);
  }

  clearHistories(deviceId: string) {
    return this.historyRepository.clearByDeviceId(deviceId);
  }
}
