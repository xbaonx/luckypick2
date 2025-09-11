import { IsString, MinLength } from 'class-validator';

export class RejectWithdrawDto {
  @IsString()
  @MinLength(1)
  reason: string;
}
