import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserService } from '../user/user.service';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService, private userService: UserService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto.email, registerDto.password);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    // Return a fresh user snapshot from DB so balances and flags are up to date
    return this.userService.findById(req.user.id).then((user) => {
      if (!user) return null
      const { passwordHash, ...safe } = user as any
      return safe
    })
  }

  @Post('guest')
  async createGuestSession() {
    const { userService } = this.authService as any;
    const guestUser = await userService.createGuestUser();
    return this.authService.login(guestUser);
  }
}
