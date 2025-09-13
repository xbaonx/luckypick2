import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { MetricsService } from './metrics.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('api/metrics')
export class MetricsController {
  constructor(private metrics: MetricsService) {}

  // Public endpoint: allow anonymous (no guard) to log CTA events
  @Post('cta')
  async logCta(@Body() body: { name: string; variant: string; action: 'view' | 'click'; mode?: string; amount?: number; userId?: string }) {
    const { name, variant, action, mode, amount, userId } = body
    if (!name || !variant || !action) {
      return { success: false, error: 'Missing name|variant|action' }
    }
    await this.metrics.logCta({ name, variant, action, mode: mode ?? null, amount: amount ?? null, userId: userId ?? null })
    return { success: true }
  }
}
