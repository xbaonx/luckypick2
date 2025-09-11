import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum GameMode {
  FUN = 'fun',
  USDT = 'usdt',
}

@Entity('game_histories')
export class GameHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, user => user.gameHistories)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', enum: GameMode })
  mode: GameMode;

  @Column('simple-json')
  numbers: number[];

  @Column('simple-json')
  betAmounts: number[];

  @Column()
  result: number;

  @Column({ type: 'decimal', precision: 20, scale: 6, default: 0 })
  totalBet: number;

  @Column({ type: 'decimal', precision: 20, scale: 6, default: 0 })
  winAmount: number;

  @Column()
  isWin: boolean;

  @Column({ type: 'decimal', precision: 20, scale: 6 })
  balanceAfter: number;

  @CreateDateColumn()
  createdAt: Date;
}
