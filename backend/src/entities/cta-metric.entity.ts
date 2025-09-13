import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { User } from './user.entity'

export type CtaAction = 'view' | 'click'

@Entity('cta_metrics')
@Index(['name', 'variant', 'action'])
export class CtaMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: true })
  userId: string | null

  @ManyToOne(() => User, user => user.id, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User | null

  @Column()
  name: string // e.g. fun_win_usdt_upsell

  @Column()
  variant: string

  @Column()
  action: CtaAction // 'view' | 'click'

  @Column({ nullable: true })
  mode: string | null

  @Column({ type: 'decimal', precision: 20, scale: 6, nullable: true })
  amount: number | null

  @CreateDateColumn()
  createdAt: Date
}
