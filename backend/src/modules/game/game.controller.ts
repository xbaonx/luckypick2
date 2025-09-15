import { Controller, Post, Get, Body, UseGuards, Request, Query } from '@nestjs/common';
import { GameService } from './game.service';
import { GameMode } from '../../entities/game-history.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { PlayGameDto } from './dto/play-game.dto';

@Controller('api/game')
export class GameController {
  constructor(private gameService: GameService) {}

  @UseGuards(JwtAuthGuard)
  @Post('play')
  async play(@Request() req, @Body() playGameDto: PlayGameDto) {
    playGameDto.userId = req.user.id;
    return await this.gameService.play(playGameDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getMyHistory(@Request() req, @Query('limit') limit?: number) {
    return await this.gameService.getGameHistory(req.user.id, limit || 50);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('all-history')
  async getAllHistory(
    @Query('q') q?: string,
    @Query('mode') mode?: 'fun' | 'usdt',
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sortBy') sortBy?: 'date' | 'totalBet' | 'winAmount',
    @Query('sortDir') sortDir?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('limit') limit?: number, // backward compat (ignored if page/pageSize provided)
  ) {
    const p = Math.max(1, parseInt(page || '1', 10) || 1)
    const ps = Math.max(1, Math.min(200, parseInt(pageSize || '20', 10) || (limit || 20)))
    const fromTs = from ? Date.parse(from) : undefined
    const toTs = to ? Date.parse(to) : undefined
    const normMode: GameMode | undefined = mode === 'fun' ? GameMode.FUN : mode === 'usdt' ? GameMode.USDT : undefined
    return await this.gameService.getAllGameHistory({ q, mode: normMode, from: fromTs, to: toTs, sortBy, sortDir, page: p, pageSize: ps })
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('stats')
  async getStats() {
    return await this.gameService.getGameStats();
  }
}
