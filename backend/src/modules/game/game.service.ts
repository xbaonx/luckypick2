import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameHistory, GameMode } from '../../entities/game-history.entity';
import { UserService } from '../user/user.service';
import { PlayGameDto } from './dto/play-game.dto';
import { UserType } from '../../entities/user.entity';
import { AdminConfig } from '../../entities/admin-config.entity';

@Injectable()
export class GameService {
  private configCache = new Map<string, { value: string; expiry: number }>()

  constructor(
    @InjectRepository(GameHistory)
    private gameHistoryRepository: Repository<GameHistory>,
    private userService: UserService,
    @InjectRepository(AdminConfig)
    private adminConfigRepository: Repository<AdminConfig>,
  ) {}

  private async getConfigNumber(key: string, fallback: number): Promise<number> {
    const cached = this.configCache.get(key)
    let value: string | undefined
    
    if (cached && Date.now() < cached.expiry) {
      value = cached.value
    } else {
      const rec = await this.adminConfigRepository.findOne({ where: { key } })
      value = rec?.value
      if (value !== undefined) {
        this.configCache.set(key, { value, expiry: Date.now() + 60_000 }) // 60s cache
      }
    }
    
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
  }

  private async getConfigBoolean(key: string, fallback: boolean): Promise<boolean> {
    const cached = this.configCache.get(key)
    let value: string | undefined
    
    if (cached && Date.now() < cached.expiry) {
      value = cached.value
    } else {
      const rec = await this.adminConfigRepository.findOne({ where: { key } })
      value = rec?.value
      if (value !== undefined) {
        this.configCache.set(key, { value, expiry: Date.now() + 60_000 }) // 60s cache
      }
    }
    
    if (!value) return fallback
    const v = value.toString().toLowerCase().trim()
    if (v === 'true' || v === '1' || v === 'yes') return true
    if (v === 'false' || v === '0' || v === 'no') return false
    return fallback
  }

  async play(playGameDto: PlayGameDto) {
    const { userId, mode, numbers, betAmounts } = playGameDto;
    
    // Get user
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Enforce registration for USDT mode
    if (mode === GameMode.USDT && user.type !== UserType.REGISTERED) {
      throw new Error('Only registered users can play USDT mode');
    }

    // Maintenance mode check
    const maintenance = await this.getConfigBoolean('maintenance_mode', false)
    if (maintenance) {
      throw new Error('System under maintenance')
    }

    // Calculate total bet
    const totalBet = betAmounts.reduce((sum, amount) => sum + amount, 0);

    // Check balance
    if (mode === GameMode.FUN) {
      if (user.balanceFun < totalBet) {
        throw new Error('Insufficient FunCoin balance');
      }
    } else {
      if (user.balanceUsdt < totalBet) {
        throw new Error('Insufficient USDT balance');
      }
    }

    // Read config values
    const payout = mode === GameMode.FUN
      ? await this.getConfigNumber('fun_payout', 10)
      : await this.getConfigNumber('usdt_payout', 70)
    const winRate = mode === GameMode.FUN
      ? await this.getConfigNumber('fun_win_rate', 5)
      : await this.getConfigNumber('usdt_win_rate', 1)

    // Generate result with biased win rate
    const selSet = new Set(numbers)
    const unselected: number[] = []
    for (let i = 0; i < 100; i++) if (!selSet.has(i)) unselected.push(i)

    const wantWin = Math.random() * 100 < Math.max(0, Math.min(100, winRate))
    let result: number
    if (wantWin && selSet.size > 0) {
      const arr = Array.from(selSet)
      result = arr[Math.floor(Math.random() * arr.length)]
    } else if (!wantWin && unselected.length > 0) {
      result = unselected[Math.floor(Math.random() * unselected.length)]
    } else {
      result = Math.floor(Math.random() * 100)
    }

    // Calculate win
    let winAmount = 0;
    let isWin = false;
    
    for (let i = 0; i < numbers.length; i++) {
      if (numbers[i] === result) {
        isWin = true;
        winAmount += betAmounts[i] * payout;
      }
    }

    // Update balance
    let newBalance: number;
    if (mode === GameMode.FUN) {
      newBalance = Number(user.balanceFun) - totalBet + winAmount;
      await this.userService.updateBalance(userId, newBalance, undefined);
    } else {
      newBalance = Number(user.balanceUsdt) - totalBet + winAmount;
      await this.userService.updateBalance(userId, undefined, newBalance);
    }

    // Save game history
    const gameHistory = this.gameHistoryRepository.create({
      userId,
      mode,
      numbers,
      betAmounts,
      result,
      totalBet,
      winAmount,
      isWin,
      balanceAfter: newBalance,
    });
    await this.gameHistoryRepository.save(gameHistory);

    return {
      result,
      winAmount,
      isWin,
      newBalance,
      mode,
      gameId: gameHistory.id,
    };
  }

  async getGameHistory(userId: string, limit: number = 50) {
    return await this.gameHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getAllGameHistory(limit: number = 100) {
    return await this.gameHistoryRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }

  async getGameStats() {
    const totalGames = await this.gameHistoryRepository.count();
    const totalWins = await this.gameHistoryRepository.count({ where: { isWin: true } });
    
    const funGames = await this.gameHistoryRepository.count({ where: { mode: GameMode.FUN } });
    const usdtGames = await this.gameHistoryRepository.count({ where: { mode: GameMode.USDT } });
    
    const totalBetResult = await this.gameHistoryRepository
      .createQueryBuilder('game')
      .select('SUM(game.totalBet)', 'totalBet')
      .addSelect('SUM(game.winAmount)', 'totalWin')
      .getRawOne();

    // Detailed stats by mode
    const funStats = await this.gameHistoryRepository
      .createQueryBuilder('game')
      .select('COUNT(*)', 'games')
      .addSelect('SUM(CASE WHEN game.isWin = 1 THEN 1 ELSE 0 END)', 'wins')
      .addSelect('SUM(game.totalBet)', 'totalBet')
      .addSelect('SUM(game.winAmount)', 'totalPayout')
      .where('game.mode = :mode', { mode: GameMode.FUN })
      .getRawOne();

    const usdtStats = await this.gameHistoryRepository
      .createQueryBuilder('game')
      .select('COUNT(*)', 'games')
      .addSelect('SUM(CASE WHEN game.isWin = 1 THEN 1 ELSE 0 END)', 'wins')
      .addSelect('SUM(game.totalBet)', 'totalBet')
      .addSelect('SUM(game.winAmount)', 'totalPayout')
      .where('game.mode = :mode', { mode: GameMode.USDT })
      .getRawOne();

    return {
      totalGames,
      totalWins,
      winRate: totalGames > 0 ? (totalWins / totalGames) * 100 : 0,
      funGames,
      usdtGames,
      totalBet: totalBetResult?.totalBet || 0,
      totalPayout: totalBetResult?.totalWin || 0,
      // Detailed breakdown by mode
      funMode: {
        games: Number(funStats?.games || 0),
        wins: Number(funStats?.wins || 0),
        winRate: Number(funStats?.games || 0) > 0 ? (Number(funStats?.wins || 0) / Number(funStats?.games || 0)) * 100 : 0,
        totalBet: Number(funStats?.totalBet || 0),
        totalPayout: Number(funStats?.totalPayout || 0),
        houseEdge: Number(funStats?.totalBet || 0) > 0 ? ((Number(funStats?.totalBet || 0) - Number(funStats?.totalPayout || 0)) / Number(funStats?.totalBet || 0)) * 100 : 0,
      },
      usdtMode: {
        games: Number(usdtStats?.games || 0),
        wins: Number(usdtStats?.wins || 0),
        winRate: Number(usdtStats?.games || 0) > 0 ? (Number(usdtStats?.wins || 0) / Number(usdtStats?.games || 0)) * 100 : 0,
        totalBet: Number(usdtStats?.totalBet || 0),
        totalPayout: Number(usdtStats?.totalPayout || 0),
        houseEdge: Number(usdtStats?.totalBet || 0) > 0 ? ((Number(usdtStats?.totalBet || 0) - Number(usdtStats?.totalPayout || 0)) / Number(usdtStats?.totalBet || 0)) * 100 : 0,
      },
    };
  }
}
