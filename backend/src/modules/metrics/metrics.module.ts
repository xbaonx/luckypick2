import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CtaMetric } from '../../entities/cta-metric.entity'
import { MetricsService } from './metrics.service'
import { MetricsController } from './metrics.controller'

@Module({
  imports: [TypeOrmModule.forFeature([CtaMetric])],
  providers: [MetricsService],
  controllers: [MetricsController],
  exports: [MetricsService],
})
export class MetricsModule {}
