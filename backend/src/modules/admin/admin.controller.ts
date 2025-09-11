import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UpdateConfigDto } from './dto/update-config.dto';

@Controller('api/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return await this.adminService.getDashboardStats();
  }

  @Get('config')
  async getAllConfigs() {
    return await this.adminService.getAllConfigs();
  }

  @Get('config/:key')
  async getConfig(@Param('key') key: string) {
    const value = await this.adminService.getConfig(key);
    return { key, value };
  }

  @Put('config/:key')
  async updateConfig(@Param('key') key: string, @Body() updateConfigDto: UpdateConfigDto) {
    return await this.adminService.updateConfig(key, updateConfigDto.value);
  }

  @Get('user/:id')
  async getUserDetails(@Param('id') id: string) {
    return await this.adminService.getUserDetails(id);
  }
}
