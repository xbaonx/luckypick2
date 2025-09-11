import { GameHistory } from './game-history.entity';
import { TxHistory } from './tx-history.entity';
export declare class User {
    id: string;
    userId: string;
    walletIndex: number;
    address: string;
    balanceFun: number;
    balanceUsdt: number;
    isActive: boolean;
    gameHistories: GameHistory[];
    txHistories: TxHistory[];
    createdAt: Date;
    updatedAt: Date;
}
