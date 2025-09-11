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
var WithdrawService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const tx_history_entity_1 = require("../../entities/tx-history.entity");
const user_service_1 = require("../user/user.service");
const wallet_service_1 = require("../wallet/wallet.service");
const ethers_1 = require("ethers");
let WithdrawService = WithdrawService_1 = class WithdrawService {
    constructor(txHistoryRepository, userService, walletService, configService) {
        this.txHistoryRepository = txHistoryRepository;
        this.userService = userService;
        this.walletService = walletService;
        this.configService = configService;
        this.logger = new common_1.Logger(WithdrawService_1.name);
        this.USDT_ABI = [
            'function transfer(address to, uint256 amount) returns (bool)',
            'function decimals() view returns (uint8)',
        ];
        this.initializeProvider();
    }
    initializeProvider() {
        const rpcUrl = this.configService.get('RPC_URL');
        this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
        const tokenAddress = this.configService.get('TOKEN_ADDRESS');
        this.usdtContract = new ethers_1.ethers.Contract(tokenAddress, this.USDT_ABI, this.provider);
    }
    async withdraw(dto) {
        const { userId, amount, toAddress } = dto;
        try {
            if (!ethers_1.ethers.isAddress(toAddress)) {
                throw new common_1.BadRequestException('Invalid withdrawal address');
            }
            const user = await this.userService.findByUserId(userId);
            if (Number(user.balanceUsdt) < amount) {
                throw new common_1.BadRequestException('Insufficient USDT balance');
            }
            const txHistory = this.txHistoryRepository.create({
                userId,
                type: 'withdraw',
                txHash: '',
                fromAddress: this.configService.get('ADMIN_ADDRESS'),
                toAddress,
                amount,
                currency: 'USDT',
                status: 'pending',
                note: `Withdrawal request for ${amount} USDT`,
            });
            await this.txHistoryRepository.save(txHistory);
            const adminWallet = this.walletService.getAdminWallet();
            const contractWithSigner = this.usdtContract.connect(adminWallet);
            const decimals = await this.usdtContract.decimals();
            const amountInWei = ethers_1.ethers.parseUnits(amount.toString(), decimals);
            const tx = await contractWithSigner['transfer'](toAddress, amountInWei);
            txHistory.txHash = tx.hash;
            await this.txHistoryRepository.save(txHistory);
            const receipt = await tx.wait();
            await this.userService.updateBalance(userId, 'usdt', amount, 'subtract');
            txHistory.status = 'confirmed';
            txHistory.blockNumber = receipt.blockNumber;
            await this.txHistoryRepository.save(txHistory);
            this.logger.log(`Withdrawal successful: ${userId} withdrew ${amount} USDT to ${toAddress}, tx: ${tx.hash}`);
            return {
                success: true,
                txHash: tx.hash,
                status: 'confirmed',
            };
        }
        catch (error) {
            this.logger.error(`Withdrawal failed for ${userId}:`, error);
            const failedTx = await this.txHistoryRepository.findOne({
                where: { userId, type: 'withdraw', status: 'pending' },
                order: { createdAt: 'DESC' },
            });
            if (failedTx) {
                failedTx.status = 'failed';
                failedTx.note = `Failed: ${error.message}`;
                await this.txHistoryRepository.save(failedTx);
            }
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async getWithdrawHistory(userId) {
        return this.txHistoryRepository.find({
            where: { userId, type: 'withdraw' },
            order: { createdAt: 'DESC' },
        });
    }
};
exports.WithdrawService = WithdrawService;
exports.WithdrawService = WithdrawService = WithdrawService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tx_history_entity_1.TxHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        user_service_1.UserService,
        wallet_service_1.WalletService,
        config_1.ConfigService])
], WithdrawService);
//# sourceMappingURL=withdraw.service.js.map