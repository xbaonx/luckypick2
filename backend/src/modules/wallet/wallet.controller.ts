import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('api/wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('setup-seed')
  async setupSeed(@Body() body: { seedPhrase: string }) {
    await this.walletService.saveSeedPhrase(body.seedPhrase);
    return { message: 'Seed phrase saved successfully' };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('check-balance')
  async checkBalance(@Body() body: { address: string }) {
    const tokenAddress = process.env.TOKEN_ADDRESS;
    const balance = await this.walletService.getBalance(body.address, tokenAddress);
    return { balance };
  }
}
