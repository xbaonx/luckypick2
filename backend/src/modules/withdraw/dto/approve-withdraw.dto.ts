import { IsOptional, IsString } from 'class-validator';

export class ApproveWithdrawDto {
  @IsOptional()
  @IsString()
  note?: string;
}
