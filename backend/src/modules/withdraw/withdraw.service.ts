import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WithdrawRequest, WithdrawStatus } from '../../entities/withdraw-request.entity';
import { TxHistory, TxType, TxStatus } from '../../entities/tx-history.entity';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateWithdrawDto } from './dto/create-withdraw.dto';
import { UserType } from '../../entities/user.entity';
import { AdminConfig } from '../../entities/admin-config.entity';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WithdrawService {
  private readonly logger = new Logger(WithdrawService.name);
  private configCache = new Map<string, { value: string; expiry: number }>();

  constructor(
    @InjectRepository(WithdrawRequest)
    private withdrawRequestRepository: Repository<WithdrawRequest>,
    @InjectRepository(TxHistory)
    private txHistoryRepository: Repository<TxHistory>,
    private userService: UserService,
    private walletService: WalletService,
    private configService: ConfigService,
    @InjectRepository(AdminConfig)
    private adminConfigRepository: Repository<AdminConfig>,
  ) {}

  private async getConfigNumber(key: string, fallback: number): Promise<number> {
    const cached = this.configCache.get(key);
    let value: string | undefined;

    if (cached && Date.now() < cached.expiry) {
      value = cached.value;
    } else {
      const rec = await this.adminConfigRepository.findOne({ where: { key } });
      value = rec?.value;
      if (value !== undefined) {
        this.configCache.set(key, { value, expiry: Date.now() + 60_000 }); // 60s cache
      }
    }

    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  private async getConfigBoolean(key: string, fallback: boolean): Promise<boolean> {
    const cached = this.configCache.get(key);
    let value: string | undefined;

    if (cached && Date.now() < cached.expiry) {
      value = cached.value;
    } else {
      const rec = await this.adminConfigRepository.findOne({ where: { key } });
      value = rec?.value;
      if (value !== undefined) {
        this.configCache.set(key, { value, expiry: Date.now() + 60_000 }); // 60s cache
      }
    }

    if (!value) return fallback;
    const v = value.toString().toLowerCase().trim();
    if (v === 'true' || v === '1' || v === 'yes') return true;
    if (v === 'false' || v === '0' || v === 'no') return false;
    return fallback;
  }

  // Expose current withdraw limits for authenticated users (non-admin)
  async getWithdrawLimits(): Promise<{ minWithdraw: number; maxWithdraw: number }> {
    // Bypass in-memory cache so changes in Admin reflect immediately
    const minRec = await this.adminConfigRepository.findOne({ where: { key: 'min_withdraw' } })
    const maxRec = await this.adminConfigRepository.findOne({ where: { key: 'max_withdraw' } })
    const min = Number(minRec?.value)
    const max = Number(maxRec?.value)
    return {
      minWithdraw: Number.isFinite(min) ? min : 10,
      maxWithdraw: Number.isFinite(max) ? max : 1000,
    }
  }

  async createWithdrawRequest(userId: string, createWithdrawDto: CreateWithdrawDto): Promise<WithdrawRequest> {
    const { amount, toAddress } = createWithdrawDto;
    
    // Get user
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    
    // Check if user is registered
    if (user.type !== UserType.REGISTERED) {
      throw new BadRequestException('Only registered users can withdraw');
    }

    // Maintenance mode
    const maintenance = await this.getConfigBoolean('maintenance_mode', false)
    if (maintenance) {
      throw new BadRequestException('System under maintenance')
    }

    // Enforce min/max withdraw
    const minWithdraw = await this.getConfigNumber('min_withdraw', 10)
    const maxWithdraw = await this.getConfigNumber('max_withdraw', 1000)
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      throw new BadRequestException('Invalid withdraw amount')
    }
    if (amt < minWithdraw) {
      throw new BadRequestException(`Minimum withdraw is ${minWithdraw}`)
    }
    if (amt > maxWithdraw) {
      throw new BadRequestException(`Maximum withdraw is ${maxWithdraw}`)
    }
    
    // Check balance
    if (Number(user.balanceUsdt) < amt) {
      throw new BadRequestException('Insufficient USDT balance');
    }
    
    // Create withdraw request
    const withdrawRequest = this.withdrawRequestRepository.create({
      userId,
      amount: amt,
      toAddress,
      status: WithdrawStatus.PENDING,
    });
    
    // Deduct balance immediately
    await this.userService.updateBalance(userId, undefined, Number(user.balanceUsdt) - amt);
    
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

  // Mark as paid manually (no on-chain transfer)
  async manualMarkPaid(requestId: string, adminId: string, txRef?: string): Promise<WithdrawRequest> {
    const request = await this.withdrawRequestRepository.findOne({
      where: { id: requestId },
      relations: ['user'],
    })
    if (!request) {
      throw new BadRequestException('Withdraw request not found')
    }
    if (request.status !== WithdrawStatus.PENDING) {
      throw new BadRequestException('Request is not pending')
    }

    request.status = WithdrawStatus.COMPLETED
    request.txHash = txRef || 'manual'
    request.approvedBy = adminId
    await this.withdrawRequestRepository.save(request)

    // Record a manual tx history for audit
    const txHistory = this.txHistoryRepository.create({
      userId: request.userId,
      type: TxType.WITHDRAW,
      txHash: request.txHash,
      fromAddress: 'manual',
      toAddress: request.toAddress,
      amount: request.amount,
      status: TxStatus.CONFIRMED,
    })
    await this.txHistoryRepository.save(txHistory)

    return request
  }

  async findWithdrawRequest(requestId: string): Promise<WithdrawRequest | null> {
    return await this.withdrawRequestRepository.findOne({
      where: { id: requestId },
      relations: ['user'],
    });
  }

  async updateWithdrawStatus(requestId: string, updates: { status: WithdrawStatus; txHash?: string; approvedBy?: string }): Promise<void> {
    await this.withdrawRequestRepository.update(requestId, updates);
  }

  async createManualTxHistory(data: { userId: string; type: string; txHash: string; fromAddress: string; toAddress: string; amount: number; status: string }): Promise<void> {
    const txHistory = this.txHistoryRepository.create({
      userId: data.userId,
      type: TxType.WITHDRAW,
      txHash: data.txHash,
      fromAddress: data.fromAddress,
      toAddress: data.toAddress,
      amount: data.amount,
      status: TxStatus.CONFIRMED,
    });
    await this.txHistoryRepository.save(txHistory);
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
