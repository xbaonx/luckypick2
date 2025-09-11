import { Controller, Post, Get, Body, UseGuards, Request, Query } from '@nestjs/common';
import { GameService } from './game.service';
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
  async getAllHistory(@Query('limit') limit?: number) {
    return await this.gameService.getAllGameHistory(limit || 100);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('stats')
  async getStats() {
    return await this.gameService.getGameStats();
  }
}
