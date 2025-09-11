import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../../entities/user.entity';
import { TxHistory } from '../../entities/tx-history.entity';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
export declare class CronService {
    private userRepository;
    private txHistoryRepository;
    private userService;
    private walletService;
    private configService;
    private readonly logger;
    private provider;
    private lastProcessedBlock;
    private isProcessing;
    constructor(userRepository: Repository<User>, txHistoryRepository: Repository<TxHistory>, userService: UserService, walletService: WalletService, configService: ConfigService);
    private initializeProvider;
    private loadLastProcessedBlock;
    scanDeposits(): Promise<void>;
    private checkUserDeposits;
    private gomFunds;
    triggerScan(): Promise<void>;
}
