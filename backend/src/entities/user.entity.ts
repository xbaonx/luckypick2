import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { GameHistory } from './game-history.entity';
import { TxHistory } from './tx-history.entity';
import { WithdrawRequest } from './withdraw-request.entity';

export enum UserType {
  GUEST = 'guest',
  REGISTERED = 'registered',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', enum: UserType, default: UserType.GUEST })
  type: UserType;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ nullable: true })
  passwordHash: string;

  @Column({ nullable: true })
  walletAddress: string;

  @Column({ nullable: true })
  walletIndex: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  balanceFun: number;

  @Column({ type: 'decimal', precision: 20, scale: 6, default: 0 })
  balanceUsdt: number;

  @Column({ nullable: true })
  sessionId: string;

  @Column({ default: false })
  isAdmin: boolean;

  @OneToMany(() => GameHistory, gameHistory => gameHistory.user)
  gameHistories: GameHistory[];

  @OneToMany(() => TxHistory, txHistory => txHistory.user)
  txHistories: TxHistory[];

  @OneToMany(() => WithdrawRequest, withdrawRequest => withdrawRequest.user)
  withdrawRequests: WithdrawRequest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
