import { GameService, GameResult } from './game.service';
import { PlayGameDto } from '../../dto/play-game.dto';
export declare class GameController {
    private readonly gameService;
    constructor(gameService: GameService);
    play(dto: PlayGameDto): Promise<GameResult>;
    getHistory(userId: string): Promise<import("../../entities/game-history.entity").GameHistory[]>;
}
