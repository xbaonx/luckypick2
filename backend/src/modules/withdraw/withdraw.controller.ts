import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { WithdrawService } from './withdraw.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreateWithdrawDto } from './dto/create-withdraw.dto';
import { ApproveWithdrawDto } from './dto/approve-withdraw.dto';
import { RejectWithdrawDto } from './dto/reject-withdraw.dto';

@Controller('api/withdraw')
export class WithdrawController {
  constructor(private withdrawService: WithdrawService) {}

  @UseGuards(JwtAuthGuard)
  @Post('request')
  async createWithdrawRequest(@Request() req, @Body() createWithdrawDto: CreateWithdrawDto) {
    return await this.withdrawService.createWithdrawRequest(req.user.id, createWithdrawDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-requests')
  async getMyWithdrawRequests(@Request() req) {
    return await this.withdrawService.getUserWithdrawRequests(req.user.id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('all')
  async getAllWithdrawRequests() {
    return await this.withdrawService.getAllWithdrawRequests();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('pending')
  async getPendingWithdrawRequests() {
    return await this.withdrawService.getPendingWithdrawRequests();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post(':id/approve')
  async approveWithdraw(@Request() req, @Param('id') id: string) {
    return await this.withdrawService.approveWithdraw(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post(':id/reject')
  async rejectWithdraw(@Param('id') id: string, @Body() rejectDto: RejectWithdrawDto) {
    return await this.withdrawService.rejectWithdraw(id, rejectDto.reason);
  }
}
