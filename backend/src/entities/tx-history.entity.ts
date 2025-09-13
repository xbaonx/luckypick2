import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

export enum TxType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  GOM_FUNDS = 'gom_funds',
}

export enum TxStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

@Entity('tx_histories')
@Index(['type', 'txHash'], { unique: true })
export class TxHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User, user => user.txHistories, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', enum: TxType })
  type: TxType;

  @Column()
  txHash: string;

  @Column()
  fromAddress: string;

  @Column()
  toAddress: string;

  @Column({ type: 'decimal', precision: 20, scale: 6 })
  amount: number;

  @Column({ type: 'varchar', enum: TxStatus, default: TxStatus.PENDING })
  status: TxStatus;

  @Column({ nullable: true })
  blockNumber: number;

  @Column({ nullable: true })
  gasUsed: string;

  @CreateDateColumn()
  createdAt: Date;
}
