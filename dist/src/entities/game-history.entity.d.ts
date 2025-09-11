import { User } from './user.entity';
export interface BetInfo {
    number: string;
    amount: number;
    won: boolean;
}
export declare class GameHistory {
    id: string;
    userId: string;
    user: User;
    mode: 'fun' | 'usdt';
    bets: BetInfo[];
    result: string;
    totalBetAmount: number;
    winAmount: number;
    balanceAfter: number;
    timestamp: Date;
}
