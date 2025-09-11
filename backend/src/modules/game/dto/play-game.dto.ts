import { IsEnum, IsArray, IsNumber, ArrayMinSize, ArrayMaxSize, IsOptional, IsString } from 'class-validator';
import { GameMode } from '../../../entities/game-history.entity';

export class PlayGameDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsEnum(GameMode)
  mode: GameMode;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsNumber({}, { each: true })
  numbers: number[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsNumber({}, { each: true })
  betAmounts: number[];
}
