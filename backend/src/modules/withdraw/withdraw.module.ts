import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WithdrawService } from './withdraw.service';
import { WithdrawController } from './withdraw.controller';
import { WithdrawRequest } from '../../entities/withdraw-request.entity';
import { TxHistory } from '../../entities/tx-history.entity';
import { AdminConfig } from '../../entities/admin-config.entity';
import { UserModule } from '../user/user.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WithdrawRequest, TxHistory, AdminConfig]),
    UserModule,
    WalletModule,
  ],
  providers: [WithdrawService],
  controllers: [WithdrawController],
  exports: [WithdrawService],
})
export class WithdrawModule {}
