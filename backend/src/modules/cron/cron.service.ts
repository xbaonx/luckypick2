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

  constructor(
    @InjectRepository(TxHistory)
    private txHistoryRepository: Repository<TxHistory>,
    private userService: UserService,
    private walletService: WalletService,
    private configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async scanDeposits() {
    if (this.isScanning) {
      return;
    }

    this.isScanning = true;
    try {
      this.logger.log('Starting deposit scan...');
      
      // Get all registered users with wallet addresses
      const users = await this.userService.getAllRegisteredUsers();
      
      for (const user of users) {
        if (!user.walletAddress) continue;
        
        try {
          // Check USDT balance on wallet
          const balance = await this.walletService.checkDeposit(user.walletAddress);
          
          if (balance > 0) {
            this.logger.log(`Found ${balance} USDT in wallet ${user.walletAddress}`);
            
            // Check if we already processed this deposit
            const existingTx = await this.txHistoryRepository.findOne({
              where: {
                toAddress: user.walletAddress,
                status: TxStatus.CONFIRMED,
              },
              order: { createdAt: 'DESC' },
            });
            
            // If balance is different from last recorded, it's a new deposit
            if (!existingTx || existingTx.amount !== balance) {
              // Update user balance
              await this.userService.addBalance(user.id, 0, balance);
              
              // Create transaction history
              const txHistory = this.txHistoryRepository.create({
                userId: user.id,
                type: TxType.DEPOSIT,
                txHash: `deposit_${Date.now()}_${user.id}`,
                fromAddress: 'MoonPay',
                toAddress: user.walletAddress,
                amount: balance,
                status: TxStatus.CONFIRMED,
              });
              await this.txHistoryRepository.save(txHistory);
              
              // Check if wallet has enough gas
              const hasGas = await this.walletService.checkGasBalance(user.walletAddress);
              
              if (hasGas) {
                // Gom funds to admin wallet
                try {
                  const txHash = await this.walletService.gomFunds(user.walletIndex, balance.toString());
                  
                  const gomTxHistory = this.txHistoryRepository.create({
                    userId: user.id,
                    type: TxType.GOM_FUNDS,
                    txHash,
                    fromAddress: user.walletAddress,
                    toAddress: this.configService.get<string>('ADMIN_ADDRESS'),
                    amount: balance,
                    status: TxStatus.CONFIRMED,
                  });
                  await this.txHistoryRepository.save(gomTxHistory);
                  
                  this.logger.log(`Successfully collected ${balance} USDT from ${user.walletAddress}`);
                } catch (error) {
                  this.logger.error(`Failed to collect funds from ${user.walletAddress}:`, error);
                }
              } else {
                this.logger.warn(`Wallet ${user.walletAddress} has insufficient gas for collection`);
              }
            }
          }
        } catch (error) {
          this.logger.error(`Error scanning wallet ${user.walletAddress}:`, error);
        }
      }
      
      this.logger.log('Deposit scan completed');
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
}
