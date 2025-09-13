import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CtaMetric } from '../../entities/cta-metric.entity'

@Injectable()
export class MetricsService {
  constructor(
    @InjectRepository(CtaMetric)
    private ctaRepo: Repository<CtaMetric>,
  ) {}

  async logCta(params: {
    userId?: string | null
    name: string
    variant: string
    action: 'view' | 'click'
    mode?: string | null
    amount?: number | null
  }) {
    const metric = this.ctaRepo.create({
      userId: params.userId || null,
      name: params.name,
      variant: params.variant,
      action: params.action,
      mode: params.mode ?? null,
      amount: params.amount ?? null,
    })
    return await this.ctaRepo.save(metric)
  }

  async getCtaSummary(name?: string) {
    const qb = this.ctaRepo.createQueryBuilder('m')
      .select('m.name', 'name')
      .addSelect('m.variant', 'variant')
      .addSelect('m.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('m.name')
      .addGroupBy('m.variant')
      .addGroupBy('m.action')
      .orderBy('m.name', 'ASC')
      .addOrderBy('m.variant', 'ASC')
      .addOrderBy('m.action', 'ASC')

    if (name) qb.where('m.name = :name', { name })

    const rows = await qb.getRawMany()
    // shape into { [name]: { [variant]: { view: n, click: n } } }
    const summary: Record<string, Record<string, Record<string, number>>> = {}
    for (const r of rows) {
      summary[r.name] = summary[r.name] || {}
      summary[r.name][r.variant] = summary[r.name][r.variant] || { view: 0, click: 0 }
      summary[r.name][r.variant][r.action] = Number(r.count)
    }
    return summary
  }
}
