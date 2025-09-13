import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TxHistory, TxType, TxStatus } from '../../entities/tx-history.entity';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);
  private isScanning = false;
  private lastProcessedBlock = 0;

  constructor(
    @InjectRepository(TxHistory)
    private txHistoryRepository: Repository<TxHistory>,
    private userService: UserService,
    private walletService: WalletService,
    private configService: ConfigService,
  ) {}

  private async loadLastProcessedBlock() {
    // Use latest confirmed deposit block as watermark
    const last = await this.txHistoryRepository.findOne({
      where: { type: TxType.DEPOSIT, status: TxStatus.CONFIRMED },
      order: { blockNumber: 'DESC' },
    })
    if (last?.blockNumber) {
      this.lastProcessedBlock = last.blockNumber
    } else {
      // if none, start from currentBlock - 2000 to avoid full history scan
      try {
        const current = await this.walletService.getCurrentBlock()
        this.lastProcessedBlock = Math.max(0, current - 2000)
      } catch {
        this.lastProcessedBlock = 0
      }
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async scanDeposits() {
    if (this.isScanning) {
      return;
    }

    this.isScanning = true;
    try {
      this.logger.log('Starting deposit scan (event-based)...');

      // Ensure watermark ready
      if (this.lastProcessedBlock === 0) {
        await this.loadLastProcessedBlock()
      }

      const currentBlock = await this.walletService.getCurrentBlock()
      if (currentBlock <= this.lastProcessedBlock) {
        this.logger.log(`No new blocks to scan. current=${currentBlock}, last=${this.lastProcessedBlock}`)
        return
      }

      // Build address map for quick lookup
      const users = await this.userService.getAllRegisteredUsers();
      const addrToUser = new Map<string, { id: string; walletIndex: number; walletAddress: string }>()
      for (const u of users) {
        if (u.walletAddress) addrToUser.set(u.walletAddress.toLowerCase(), { id: u.id, walletIndex: u.walletIndex, walletAddress: u.walletAddress })
      }

      // Scan in chunks to avoid provider limits
      const CHUNK = 2000
      let from = this.lastProcessedBlock + 1
      while (from <= currentBlock) {
        const to = Math.min(from + CHUNK - 1, currentBlock)
        this.logger.log(`Scanning Transfer events from block ${from} to ${to}`)

        const events = await this.walletService.getUsdtTransferEvents(from, to)
        for (const ev of events) {
          const recipient = addrToUser.get(ev.to)
          if (!recipient) continue

          // Idempotency: skip if this tx already recorded
          const existing = await this.txHistoryRepository.findOne({ where: { type: TxType.DEPOSIT, txHash: ev.txHash } })
          if (existing) continue

          const amountNum = parseFloat(ev.amount)
          // Credit user balance
          await this.userService.addBalance(recipient.id, 0, amountNum)

          // Record deposit tx
          const dep = this.txHistoryRepository.create({
            userId: recipient.id,
            type: TxType.DEPOSIT,
            txHash: ev.txHash,
            fromAddress: ev.from,
            toAddress: recipient.walletAddress,
            amount: amountNum,
            status: TxStatus.CONFIRMED,
            blockNumber: ev.blockNumber,
          })
          await this.txHistoryRepository.save(dep)

          // Try to collect funds if gas is sufficient
          const hasGas = await this.walletService.checkGasBalance(recipient.walletAddress)
          if (hasGas) {
            try {
              const gomTxHash = await this.walletService.gomFunds(recipient.walletIndex, ev.amount)
              const gomTx = this.txHistoryRepository.create({
                userId: recipient.id,
                type: TxType.GOM_FUNDS,
                txHash: gomTxHash,
                fromAddress: recipient.walletAddress,
                toAddress: this.configService.get<string>('ADMIN_ADDRESS'),
                amount: amountNum,
                status: TxStatus.CONFIRMED,
                blockNumber: undefined,
              })
              await this.txHistoryRepository.save(gomTx)
            } catch (err) {
              this.logger.error(`Gom funds failed for ${recipient.walletAddress}: ${err?.message || err}`)
            }
          } else {
            this.logger.warn(`Wallet ${recipient.walletAddress} has insufficient gas for collection`)
          }
        }

        // advance
        from = to + 1
        this.lastProcessedBlock = to
      }

      this.logger.log('Deposit scan completed')
    } catch (error) {
      this.logger.error('Deposit scan failed:', error);
    } finally {
      this.isScanning = false;
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkPendingTransactions() {
    try {
      const pendingTxs = await this.txHistoryRepository.find({
        where: { status: TxStatus.PENDING },
      });
      
      for (const tx of pendingTxs) {
        try {
          const receipt = await this.walletService.getTransactionReceipt(tx.txHash);
          if (receipt) {
            tx.status = receipt.status === 1 ? TxStatus.CONFIRMED : TxStatus.FAILED;
            tx.blockNumber = receipt.blockNumber;
            tx.gasUsed = receipt.gasUsed.toString();
            await this.txHistoryRepository.save(tx);
          }
        } catch (error) {
          this.logger.error(`Error checking tx ${tx.txHash}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Error checking pending transactions:', error);
    }
  }

  // ---- Admin helpers ----
  async getScanStatus() {
    const current = await this.walletService.getCurrentBlock().catch(() => 0)
    return {
      isScanning: this.isScanning,
      lastProcessedBlock: this.lastProcessedBlock,
      currentBlock: current,
    }
  }

  async triggerScanNow() {
    if (this.isScanning) {
      return { started: false, reason: 'scan already in progress' }
    }
    await this.scanDeposits()
    return { started: true }
  }
}
