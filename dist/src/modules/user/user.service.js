"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../entities/user.entity");
const wallet_service_1 = require("../wallet/wallet.service");
let UserService = UserService_1 = class UserService {
    constructor(userRepository, walletService) {
        this.userRepository = userRepository;
        this.walletService = walletService;
        this.logger = new common_1.Logger(UserService_1.name);
        this.currentWalletIndex = 0;
        this.initializeWalletIndex();
    }
    async initializeWalletIndex() {
        const lastUser = await this.userRepository.findOne({
            order: { walletIndex: 'DESC' },
        });
        if (lastUser) {
            this.currentWalletIndex = lastUser.walletIndex;
        }
    }
    async register(userId) {
        try {
            const existingUser = await this.userRepository.findOne({
                where: { userId },
            });
            if (existingUser) {
                throw new common_1.ConflictException('User already exists');
            }
            this.currentWalletIndex++;
            const { address } = this.walletService.deriveWallet(this.currentWalletIndex);
            const user = this.userRepository.create({
                userId,
                walletIndex: this.currentWalletIndex,
                address,
                balanceFun: 1000,
                balanceUsdt: 0,
                isActive: true,
            });
            await this.userRepository.save(user);
            this.logger.log(`New user registered: ${userId}, wallet: ${address}`);
            return user;
        }
        catch (error) {
            this.logger.error(`Failed to register user ${userId}:`, error);
            throw error;
        }
    }
    async findByUserId(userId) {
        const user = await this.userRepository.findOne({
            where: { userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findById(id) {
        const user = await this.userRepository.findOne({
            where: { id },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findByAddress(address) {
        const user = await this.userRepository.findOne({
            where: { address },
        });
        return user;
    }
    async getBalance(userId) {
        const user = await this.findByUserId(userId);
        return {
            balanceFun: Number(user.balanceFun),
            balanceUsdt: Number(user.balanceUsdt),
        };
    }
    async updateBalance(userId, type, amount, operation) {
        const user = await this.findByUserId(userId);
        if (type === 'fun') {
            if (operation === 'add') {
                user.balanceFun = Number(user.balanceFun) + amount;
            }
            else {
                const newBalance = Number(user.balanceFun) - amount;
                if (newBalance < 0) {
                    throw new Error('Insufficient FunCoin balance');
                }
                user.balanceFun = newBalance;
            }
        }
        else {
            if (operation === 'add') {
                user.balanceUsdt = Number(user.balanceUsdt) + amount;
            }
            else {
                const newBalance = Number(user.balanceUsdt) - amount;
                if (newBalance < 0) {
                    throw new Error('Insufficient USDT balance');
                }
                user.balanceUsdt = newBalance;
            }
        }
        await this.userRepository.save(user);
        return user;
    }
    async getAllUsers() {
        return this.userRepository.find({
            where: { isActive: true },
        });
    }
};
exports.UserService = UserService;
exports.UserService = UserService = UserService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        wallet_service_1.WalletService])
], UserService);
//# sourceMappingURL=user.service.js.map