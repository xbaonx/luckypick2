import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { TxHistory } from '../../entities/tx-history.entity';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
import { WithdrawDto } from '../../dto/withdraw.dto';
export interface WithdrawResult {
    success: boolean;
    txHash?: string;
    status?: string;
    error?: string;
}
export declare class WithdrawService {
    private txHistoryRepository;
    private userService;
    private walletService;
    private configService;
    private readonly logger;
    private provider;
    private usdtContract;
    private readonly USDT_ABI;
    constructor(txHistoryRepository: Repository<TxHistory>, userService: UserService, walletService: WalletService, configService: ConfigService);
    private initializeProvider;
    withdraw(dto: WithdrawDto): Promise<WithdrawResult>;
    getWithdrawHistory(userId: string): Promise<TxHistory[]>;
}
