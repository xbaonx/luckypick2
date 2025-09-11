import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('api/users')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const user = await this.userService.findById(req.user.id);
    return {
      id: user.id,
      email: user.email,
      type: user.type,
      balanceFun: user.balanceFun,
      balanceUsdt: user.balanceUsdt,
      walletAddress: user.walletAddress,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('balance')
  async getBalance(@Request() req) {
    const user = await this.userService.findById(req.user.id);
    return {
      balanceFun: user.balanceFun,
      balanceUsdt: user.balanceUsdt,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('all')
  async getAllUsers() {
    return await this.userService.getAllUsers();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return await this.userService.findById(id);
  }
}
