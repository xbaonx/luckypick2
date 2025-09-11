import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { WalletService } from '../wallet/wallet.service';
export declare class UserService {
    private userRepository;
    private walletService;
    private readonly logger;
    private currentWalletIndex;
    constructor(userRepository: Repository<User>, walletService: WalletService);
    private initializeWalletIndex;
    register(userId: string): Promise<User>;
    findByUserId(userId: string): Promise<User>;
    findById(id: string): Promise<User>;
    findByAddress(address: string): Promise<User>;
    getBalance(userId: string): Promise<{
        balanceFun: number;
        balanceUsdt: number;
    }>;
    updateBalance(userId: string, type: 'fun' | 'usdt', amount: number, operation: 'add' | 'subtract'): Promise<User>;
    getAllUsers(): Promise<User[]>;
}
