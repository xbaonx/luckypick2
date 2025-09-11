import { User } from './user.entity';
export declare class TxHistory {
    id: string;
    userId: string;
    user: User;
    type: 'deposit' | 'withdraw' | 'gom_funds';
    txHash: string;
    fromAddress: string;
    toAddress: string;
    amount: number;
    currency: string;
    status: 'pending' | 'confirmed' | 'failed';
    blockNumber: number;
    note: string;
    createdAt: Date;
}
