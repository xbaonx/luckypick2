import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WithdrawRequest, WithdrawStatus } from '../../entities/withdraw-request.entity';
import { TxHistory, TxType, TxStatus } from '../../entities/tx-history.entity';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateWithdrawDto } from './dto/create-withdraw.dto';
import { UserType } from '../../entities/user.entity';
import { AdminConfig } from '../../entities/admin-config.entity';

@Injectable()
export class WithdrawService {
  constructor(
    @InjectRepository(WithdrawRequest)
    private withdrawRequestRepository: Repository<WithdrawRequest>,
    @InjectRepository(TxHistory)
    private txHistoryRepository: Repository<TxHistory>,
    @InjectRepository(AdminConfig)
    private adminConfigRepository: Repository<AdminConfig>,
    private userService: UserService,
    private walletService: WalletService,
  ) {}

  private async getConfigNumber(key: string, fallback: number): Promise<number> {
    const rec = await this.adminConfigRepository.findOne({ where: { key } })
    const n = Number(rec?.value)
    return Number.isFinite(n) ? n : fallback
  }

  private async getConfigBoolean(key: string, fallback: boolean): Promise<boolean> {
    const rec = await this.adminConfigRepository.findOne({ where: { key } })
    if (!rec) return fallback
    const v = (rec.value || '').toString().toLowerCase().trim()
    if (v === 'true' || v === '1' || v === 'yes') return true
    if (v === 'false' || v === '0' || v === 'no') return false
    return fallback
  }

  async createWithdrawRequest(userId: string, createWithdrawDto: CreateWithdrawDto): Promise<WithdrawRequest> {
    const { amount, toAddress } = createWithdrawDto;
    
    // Get user
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if user is registered
    if (user.type !== UserType.REGISTERED) {
      throw new Error('Only registered users can withdraw');
    }

    // Maintenance mode
    const maintenance = await this.getConfigBoolean('maintenance_mode', false)
    if (maintenance) {
      throw new Error('System under maintenance')
    }

    // Enforce min/max withdraw
    const minWithdraw = await this.getConfigNumber('min_withdraw', 10)
    const maxWithdraw = await this.getConfigNumber('max_withdraw', 1000)
    if (Number(amount) < minWithdraw) {
      throw new Error(`Minimum withdraw is ${minWithdraw}`)
    }
    if (Number(amount) > maxWithdraw) {
      throw new Error(`Maximum withdraw is ${maxWithdraw}`)
    }
    
    // Check balance
    if (user.balanceUsdt < amount) {
      throw new Error('Insufficient USDT balance');
    }
    
    // Create withdraw request
    const withdrawRequest = this.withdrawRequestRepository.create({
      userId,
      amount,
      toAddress,
      status: WithdrawStatus.PENDING,
    });
    
    // Deduct balance immediately
    await this.userService.updateBalance(userId, undefined, Number(user.balanceUsdt) - amount);
    
    return await this.withdrawRequestRepository.save(withdrawRequest);
  }

  async approveWithdraw(requestId: string, adminId: string): Promise<WithdrawRequest> {
    const request = await this.withdrawRequestRepository.findOne({
      where: { id: requestId },
      relations: ['user'],
    });
    
    if (!request) {
      throw new Error('Withdraw request not found');
    }
    
    if (request.status !== WithdrawStatus.PENDING) {
      throw new Error('Request is not pending');
    }
    
    try {
      // Send USDT to user
      const txHash = await this.walletService.sendTransaction(
        request.toAddress,
        request.amount.toString(),
        true // isToken
      );
      
      // Update request status
      request.status = WithdrawStatus.COMPLETED;
      request.txHash = txHash;
      request.approvedBy = adminId;
      await this.withdrawRequestRepository.save(request);
      
      // Create transaction history
      const txHistory = this.txHistoryRepository.create({
        userId: request.userId,
        type: TxType.WITHDRAW,
        txHash,
        fromAddress: this.walletService.getAdminAddress(),
        toAddress: request.toAddress,
        amount: request.amount,
        status: TxStatus.CONFIRMED,
      });
      await this.txHistoryRepository.save(txHistory);
      
      return request;
    } catch (error) {
      // If transaction fails, refund the balance
      const user = request.user;
      await this.userService.updateBalance(user.id, undefined, Number(user.balanceUsdt) + Number(request.amount));
      
      request.status = WithdrawStatus.REJECTED;
      request.rejectReason = error.message;
      await this.withdrawRequestRepository.save(request);
      
      throw error;
    }
  }

  async rejectWithdraw(requestId: string, reason: string): Promise<WithdrawRequest> {
    const request = await this.withdrawRequestRepository.findOne({
      where: { id: requestId },
      relations: ['user'],
    });
    
    if (!request) {
      throw new Error('Withdraw request not found');
    }
    
    if (request.status !== WithdrawStatus.PENDING) {
      throw new Error('Request is not pending');
    }
    
    // Refund balance to user
    const user = request.user;
    await this.userService.updateBalance(user.id, undefined, Number(user.balanceUsdt) + Number(request.amount));
    
    // Update request status
    request.status = WithdrawStatus.REJECTED;
    request.rejectReason = reason;
    
    return await this.withdrawRequestRepository.save(request);
  }

  async getUserWithdrawRequests(userId: string): Promise<WithdrawRequest[]> {
    return await this.withdrawRequestRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllWithdrawRequests(): Promise<WithdrawRequest[]> {
    return await this.withdrawRequestRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  async getPendingWithdrawRequests(): Promise<WithdrawRequest[]> {
    return await this.withdrawRequestRepository.find({
      where: { status: WithdrawStatus.PENDING },
      order: { createdAt: 'ASC' },
      relations: ['user'],
    });
  }
}
