import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserType } from '../../entities/user.entity';
import { WalletService } from '../wallet/wallet.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
  ) {}

  async createGuestUser(): Promise<User> {
    const sessionId = uuidv4();
    const user = this.userRepository.create({
      type: UserType.GUEST,
      sessionId,
      balanceFun: 1000, // Auto grant 1000 FunCoin
    });
    return await this.userRepository.save(user);
  }

  async createRegisteredUser(email: string, password: string): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Get next wallet index
    const lastUser = await this.userRepository.findOne({
      where: { type: UserType.REGISTERED },
      order: { walletIndex: 'DESC' },
    });
    const nextIndex = lastUser ? lastUser.walletIndex + 1 : 0;
    
    // Derive wallet address from HD wallet
    const walletAddress = await this.walletService.deriveAddress(nextIndex);
    
    const user = this.userRepository.create({
      type: UserType.REGISTERED,
      email,
      passwordHash,
      walletAddress,
      walletIndex: nextIndex,
      balanceFun: 1000, // Also grant 1000 FunCoin to registered users
    });
    
    return await this.userRepository.save(user);
  }

  async findById(id: string): Promise<User> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findBySessionId(sessionId: string): Promise<User> {
    return await this.userRepository.findOne({ where: { sessionId } });
  }

  async findByWalletAddress(walletAddress: string): Promise<User> {
    return await this.userRepository.findOne({ where: { walletAddress } });
  }

  async updateBalance(userId: string, balanceFun?: number, balanceUsdt?: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (balanceFun !== undefined) {
      user.balanceFun = balanceFun;
    }
    if (balanceUsdt !== undefined) {
      user.balanceUsdt = balanceUsdt;
    }
    
    return await this.userRepository.save(user);
  }

  async addBalance(userId: string, funAmount?: number, usdtAmount?: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (funAmount) {
      user.balanceFun = Number(user.balanceFun) + funAmount;
    }
    if (usdtAmount) {
      user.balanceUsdt = Number(user.balanceUsdt) + usdtAmount;
    }
    
    return await this.userRepository.save(user);
  }

  async getAllRegisteredUsers(): Promise<User[]> {
    return await this.userRepository.find({
      where: { type: UserType.REGISTERED },
    });
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async createAdminUser(): Promise<User> {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@luckypick2.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
    
    const existingAdmin = await this.findByEmail(adminEmail);
    if (existingAdmin) {
      return existingAdmin;
    }
    
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const admin = this.userRepository.create({
      type: UserType.REGISTERED,
      email: adminEmail,
      passwordHash,
      isAdmin: true,
      balanceFun: 0,
      balanceUsdt: 0,
    });
    
    return await this.userRepository.save(admin);
  }
}
