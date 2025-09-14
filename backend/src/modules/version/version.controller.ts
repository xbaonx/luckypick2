import { Controller, Get } from '@nestjs/common';

@Controller('api')
export class VersionController {
  @Get('version')
  getVersion() {
    return {
      api: 'v-20250914-2',
      message: 'API is up. mark-paid route should be available at POST /api/withdraw/:id/mark-paid',
    };
  }
}
