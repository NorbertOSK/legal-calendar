import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  checkHealth() {
    return {
      ok: true,
      status: 'up',
      timestamp: new Date().toISOString(),
    };
  }
}
