import { Module } from '@nestjs/common';
import { LanTransferController } from './lan-transfer.controller';
import { LanTransferService } from './lan-transfer.service';

@Module({
  controllers: [LanTransferController],
  providers: [LanTransferService],
})
export class LanTransferModule {}
