import { IsNumber, IsString, IsPositive, IsEthereumAddress } from 'class-validator';

export class CreateWithdrawDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsEthereumAddress()
  toAddress: string;
}
