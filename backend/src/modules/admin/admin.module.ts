import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminConfig } from '../../entities/admin-config.entity';
import { UserModule } from '../user/user.module';
import { GameModule } from '../game/game.module';
import { WithdrawModule } from '../withdraw/withdraw.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminConfig]),
    UserModule,
    GameModule,
    WithdrawModule,
    WalletModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
