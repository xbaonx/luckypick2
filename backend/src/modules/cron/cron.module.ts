import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CronService } from './cron.service';
import { TxHistory } from '../../entities/tx-history.entity';
import { UserModule } from '../user/user.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TxHistory]),
    UserModule,
    WalletModule,
  ],
  providers: [CronService],
  exports: [CronService],
})
export class CronModule {}
