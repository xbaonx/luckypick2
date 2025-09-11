import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum WithdrawStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

@Entity('withdraw_requests')
export class WithdrawRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, user => user.withdrawRequests)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'decimal', precision: 20, scale: 6 })
  amount: number;

  @Column()
  toAddress: string;

  @Column({ type: 'varchar', enum: WithdrawStatus, default: WithdrawStatus.PENDING })
  status: WithdrawStatus;

  @Column({ nullable: true })
  txHash: string;

  @Column({ nullable: true })
  rejectReason: string;

  @Column({ nullable: true })
  approvedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
