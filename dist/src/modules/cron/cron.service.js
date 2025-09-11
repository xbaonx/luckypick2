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
var CronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const user_entity_1 = require("../../entities/user.entity");
const tx_history_entity_1 = require("../../entities/tx-history.entity");
const user_service_1 = require("../user/user.service");
const wallet_service_1 = require("../wallet/wallet.service");
const ethers_1 = require("ethers");
let CronService = CronService_1 = class CronService {
    constructor(userRepository, txHistoryRepository, userService, walletService, configService) {
        this.userRepository = userRepository;
        this.txHistoryRepository = txHistoryRepository;
        this.userService = userService;
        this.walletService = walletService;
        this.configService = configService;
        this.logger = new common_1.Logger(CronService_1.name);
        this.lastProcessedBlock = 0;
        this.isProcessing = false;
        this.initializeProvider();
        this.loadLastProcessedBlock();
    }
    initializeProvider() {
        const rpcUrl = this.configService.get('RPC_URL');
        this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
    }
    async loadLastProcessedBlock() {
        const lastTx = await this.txHistoryRepository.findOne({
            where: { type: 'deposit' },
            order: { blockNumber: 'DESC' },
        });
        if (lastTx && lastTx.blockNumber) {
            this.lastProcessedBlock = lastTx.blockNumber;
        }
    }
    async scanDeposits() {
        if (this.isProcessing) {
            this.logger.log('Previous scan still in progress, skipping...');
            return;
        }
        this.isProcessing = true;
        try {
            this.logger.log('Starting deposit scan...');
            const users = await this.userRepository.find({
                where: { isActive: true },
            });
            for (const user of users) {
                await this.checkUserDeposits(user);
            }
            this.logger.log('Deposit scan completed');
        }
        catch (error) {
            this.logger.error('Error during deposit scan:', error);
        }
        finally {
            this.isProcessing = false;
        }
    }
    async checkUserDeposits(user) {
        try {
            const usdtBalance = await this.walletService.getUsdtBalance(user.address);
            const balanceNum = parseFloat(usdtBalance);
            if (balanceNum > 0) {
                this.logger.log(`Found ${usdtBalance} USDT in wallet ${user.address} for user ${user.userId}`);
                const depositTx = this.txHistoryRepository.create({
                    userId: user.userId,
                    type: 'deposit',
                    txHash: `deposit_${Date.now()}`,
                    fromAddress: user.address,
                    toAddress: user.address,
                    amount: balanceNum,
                    currency: 'USDT',
                    status: 'confirmed',
                    note: `Deposit detected: ${balanceNum} USDT`,
                });
                await this.txHistoryRepository.save(depositTx);
                await this.userService.updateBalance(user.userId, 'usdt', balanceNum, 'add');
                await this.gomFunds(user, usdtBalance);
            }
        }
        catch (error) {
            this.logger.error(`Error checking deposits for user ${user.userId}:`, error);
        }
    }
    async gomFunds(user, amount) {
        try {
            this.logger.log(`Starting fund collection from ${user.address} amount: ${amount} USDT`);
            const gasBalance = await this.walletService.getNativeBalance(user.address);
            if (parseFloat(gasBalance) < 0.001) {
                this.logger.warn(`Insufficient gas in wallet ${user.address}. Gas balance: ${gasBalance}`);
                const note = this.txHistoryRepository.create({
                    userId: user.userId,
                    type: 'gom_funds',
                    txHash: '',
                    fromAddress: user.address,
                    toAddress: this.configService.get('ADMIN_ADDRESS'),
                    amount: parseFloat(amount),
                    currency: 'USDT',
                    status: 'failed',
                    note: `Insufficient gas. Need admin to send gas to ${user.address}`,
                });
                await this.txHistoryRepository.save(note);
                return;
            }
            const result = await this.walletService.gomFunds(user.walletIndex, amount);
            if (result.success) {
                const gomTx = this.txHistoryRepository.create({
                    userId: user.userId,
                    type: 'gom_funds',
                    txHash: result.txHash,
                    fromAddress: user.address,
                    toAddress: this.configService.get('ADMIN_ADDRESS'),
                    amount: parseFloat(amount),
                    currency: 'USDT',
                    status: 'confirmed',
                    note: `Funds collected successfully`,
                });
                await this.txHistoryRepository.save(gomTx);
                this.logger.log(`Successfully collected ${amount} USDT from ${user.address}, tx: ${result.txHash}`);
            }
            else {
                this.logger.error(`Failed to collect funds from ${user.address}: ${result.error}`);
                const failedTx = this.txHistoryRepository.create({
                    userId: user.userId,
                    type: 'gom_funds',
                    txHash: '',
                    fromAddress: user.address,
                    toAddress: this.configService.get('ADMIN_ADDRESS'),
                    amount: parseFloat(amount),
                    currency: 'USDT',
                    status: 'failed',
                    note: `Failed: ${result.error}`,
                });
                await this.txHistoryRepository.save(failedTx);
            }
        }
        catch (error) {
            this.logger.error(`Error collecting funds from ${user.address}:`, error);
        }
    }
    async triggerScan() {
        this.logger.log('Manual scan triggered');
        await this.scanDeposits();
    }
};
exports.CronService = CronService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "scanDeposits", null);
exports.CronService = CronService = CronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(tx_history_entity_1.TxHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        user_service_1.UserService,
        wallet_service_1.WalletService,
        config_1.ConfigService])
], CronService);
//# sourceMappingURL=cron.service.js.map