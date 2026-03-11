import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OcrInvoiceController } from './ocr-invoice.controller';
import { OCR_PROVIDER } from './ocr-provider';
import { OcrInvoiceService } from './ocr-invoice.service';
import { SiliconFlowOcrProvider } from './siliconflow-ocr.provider';

@Module({
  controllers: [OcrInvoiceController],
  providers: [
    OcrInvoiceService,
    SiliconFlowOcrProvider,
    {
      provide: OCR_PROVIDER,
      inject: [ConfigService, SiliconFlowOcrProvider],
      useFactory: (
        configService: ConfigService,
        siliconFlowOcrProvider: SiliconFlowOcrProvider,
      ) => {
        const engine = configService.get<string>('OCR_ENGINE') ?? 'disabled';

        if (engine === 'siliconflow') {
          return siliconFlowOcrProvider;
        }

        return null;
      },
    },
  ],
})
export class OcrInvoiceModule {}
