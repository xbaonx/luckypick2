import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminConfig } from '../../entities/admin-config.entity';
import { UserService } from '../user/user.service';
import { GameService } from '../game/game.service';
import { WithdrawService } from '../withdraw/withdraw.service';

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(
    @InjectRepository(AdminConfig)
    private adminConfigRepository: Repository<AdminConfig>,
    private userService: UserService,
    private gameService: GameService,
    private withdrawService: WithdrawService,
  ) {}

  async onModuleInit() {
    // Initialize default configs
    await this.initializeDefaultConfigs();
    // Create admin user if not exists
    await this.userService.createAdminUser();
  }

  private async initializeDefaultConfigs() {
    const defaultConfigs = [
      { key: 'fun_win_rate', value: '5', description: 'Win rate for Fun mode (%)' },
      { key: 'fun_payout', value: '10', description: 'Payout multiplier for Fun mode' },
      { key: 'usdt_win_rate', value: '1', description: 'Win rate for USDT mode (%)' },
      { key: 'usdt_payout', value: '70', description: 'Payout multiplier for USDT mode' },
      { key: 'min_withdraw', value: '10', description: 'Minimum USDT withdrawal amount' },
      { key: 'max_withdraw', value: '1000', description: 'Maximum USDT withdrawal amount' },
      { key: 'maintenance_mode', value: 'false', description: 'System maintenance mode' },
    ];

    for (const config of defaultConfigs) {
      const existing = await this.adminConfigRepository.findOne({
        where: { key: config.key },
      });
      
      if (!existing) {
        await this.adminConfigRepository.save(config);
      }
    }
  }

  async getConfig(key: string): Promise<string> {
    const config = await this.adminConfigRepository.findOne({ where: { key } });
    return config ? config.value : null;
  }

  async updateConfig(key: string, value: string): Promise<AdminConfig> {
    let config = await this.adminConfigRepository.findOne({ where: { key } });
    
    if (!config) {
      config = this.adminConfigRepository.create({ key, value });
    } else {
      config.value = value;
    }
    
    return await this.adminConfigRepository.save(config);
  }

  async getAllConfigs(): Promise<AdminConfig[]> {
    return await this.adminConfigRepository.find();
  }

  async getDashboardStats() {
    const users = await this.userService.getAllUsers();
    const gameStats = await this.gameService.getGameStats();
    const pendingWithdraws = await this.withdrawService.getPendingWithdrawRequests();
    
    const totalUsers = users.length;
    const registeredUsers = users.filter(u => u.type === 'registered').length;
    const guestUsers = users.filter(u => u.type === 'guest').length;
    
    const totalBalanceFun = users.reduce((sum, u) => sum + Number(u.balanceFun), 0);
    const totalBalanceUsdt = users.reduce((sum, u) => sum + Number(u.balanceUsdt), 0);
    
    return {
      users: {
        total: totalUsers,
        registered: registeredUsers,
        guest: guestUsers,
      },
      balances: {
        totalFun: totalBalanceFun,
        totalUsdt: totalBalanceUsdt,
      },
      games: gameStats,
      withdraws: {
        pending: pendingWithdraws.length,
        pendingAmount: pendingWithdraws.reduce((sum, w) => sum + Number(w.amount), 0),
      },
    };
  }

  async getUserDetails(userId: string) {
    const user = await this.userService.findById(userId);
    const gameHistory = await this.gameService.getGameHistory(userId, 10);
    const withdrawRequests = await this.withdrawService.getUserWithdrawRequests(userId);
    
    return {
      user,
      recentGames: gameHistory,
      withdrawRequests,
    };
  }
}
