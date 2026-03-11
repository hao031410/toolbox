import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getHealth() {
    return {
      status: 'ok',
      persistenceDriver:
        this.configService.get<'json' | 'database'>('PERSISTENCE_DRIVER') ??
        'json',
      timestamp: new Date().toISOString(),
    };
  }
}
