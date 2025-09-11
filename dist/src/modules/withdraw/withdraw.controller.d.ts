import { WithdrawService, WithdrawResult } from './withdraw.service';
import { WithdrawDto } from '../../dto/withdraw.dto';
export declare class WithdrawController {
    private readonly withdrawService;
    constructor(withdrawService: WithdrawService);
    withdraw(dto: WithdrawDto): Promise<WithdrawResult>;
    getHistory(userId: string): Promise<import("../../entities/tx-history.entity").TxHistory[]>;
}
