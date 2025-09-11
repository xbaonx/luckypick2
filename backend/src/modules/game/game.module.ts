import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { GameHistory } from '../../entities/game-history.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameHistory]),
    UserModule,
  ],
  providers: [GameService],
  controllers: [GameController],
  exports: [GameService],
})
export class GameModule {}
