import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OcrInvoiceService } from './ocr-invoice.service';

@Controller('ocr-invoice')
export class OcrInvoiceController {
  constructor(private readonly ocrInvoiceService: OcrInvoiceService) {}

  @Post('tasks/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 25 * 1024 * 1024,
      },
    }),
  )
  uploadTask(@UploadedFile() file?: Express.Multer.File) {
    return this.ocrInvoiceService.parseUpload(file);
  }
}
