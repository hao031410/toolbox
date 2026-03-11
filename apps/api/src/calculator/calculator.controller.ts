import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CalculatorService } from './calculator.service';
import { CreateHistoryDto } from './dto/create-history.dto';

@Controller('calculator')
export class CalculatorController {
  constructor(private readonly calculatorService: CalculatorService) {}

  @Get('histories')
  listHistories(@Query('deviceId') deviceId: string) {
    return this.calculatorService.listHistories(deviceId);
  }

  @Post('histories')
  createHistory(@Body() dto: CreateHistoryDto) {
    return this.calculatorService.createHistory(dto);
  }

  @Delete('histories/:deviceId')
  clearHistories(@Param('deviceId') deviceId: string) {
    return this.calculatorService.clearHistories(deviceId);
  }
}
