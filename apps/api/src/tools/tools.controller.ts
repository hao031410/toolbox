import { Controller, Get } from '@nestjs/common';
import { ToolsService } from './tools.service';

@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Get()
  listTools() {
    return this.toolsService.listTools();
  }
}
