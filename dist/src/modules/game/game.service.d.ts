import { Repository } from 'typeorm';
import { GameHistory, BetInfo } from '../../entities/game-history.entity';
import { UserService } from '../user/user.service';
import { PlayGameDto } from '../../dto/play-game.dto';
export interface GameResult {
    result: string;
    bets: BetInfo[];
    winAmount: number;
    newBalance: number;
    totalBetAmount: number;
}
export declare class GameService {
    private gameHistoryRepository;
    private userService;
    private readonly logger;
    private readonly FUN_WIN_MULTIPLIER;
    private readonly USDT_WIN_MULTIPLIER;
    private readonly FUN_WIN_RATE;
    private readonly USDT_WIN_RATE;
    constructor(gameHistoryRepository: Repository<GameHistory>, userService: UserService);
    play(dto: PlayGameDto): Promise<GameResult>;
    private generateResult;
    private isValidNumber;
    getHistory(userId: string, limit?: number): Promise<GameHistory[]>;
}
