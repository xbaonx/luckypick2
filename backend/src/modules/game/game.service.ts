import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameHistory, GameMode } from '../../entities/game-history.entity';
import { UserService } from '../user/user.service';
import { PlayGameDto } from './dto/play-game.dto';
import { UserType } from '../../entities/user.entity';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(GameHistory)
    private gameHistoryRepository: Repository<GameHistory>,
    private userService: UserService,
  ) {}

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

    // Generate random result (0-99)
    const result = Math.floor(Math.random() * 100);

    // Calculate win
    let winAmount = 0;
    let isWin = false;
    
    for (let i = 0; i < numbers.length; i++) {
      if (numbers[i] === result) {
        isWin = true;
        if (mode === GameMode.FUN) {
          // Fun mode: 1/20 chance, x10 payout
          winAmount += betAmounts[i] * 10;
        } else {
          // USDT mode: 1/100 chance, x70 payout
          winAmount += betAmounts[i] * 70;
        }
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

    return {
      totalGames,
      totalWins,
      winRate: totalGames > 0 ? (totalWins / totalGames) * 100 : 0,
      funGames,
      usdtGames,
      totalBet: totalBetResult?.totalBet || 0,
      totalPayout: totalBetResult?.totalWin || 0,
    };
  }
}
