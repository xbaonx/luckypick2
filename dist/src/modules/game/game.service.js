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
var GameService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const game_history_entity_1 = require("../../entities/game-history.entity");
const user_service_1 = require("../user/user.service");
let GameService = GameService_1 = class GameService {
    constructor(gameHistoryRepository, userService) {
        this.gameHistoryRepository = gameHistoryRepository;
        this.userService = userService;
        this.logger = new common_1.Logger(GameService_1.name);
        this.FUN_WIN_MULTIPLIER = 10;
        this.USDT_WIN_MULTIPLIER = 70;
        this.FUN_WIN_RATE = 0.05;
        this.USDT_WIN_RATE = 0.01;
    }
    async play(dto) {
        const { userId, mode, numbers, betAmounts } = dto;
        if (numbers.length !== betAmounts.length) {
            throw new common_1.BadRequestException('Numbers and bet amounts must have the same length');
        }
        if (numbers.some(num => !this.isValidNumber(num))) {
            throw new common_1.BadRequestException('All numbers must be between 00 and 99');
        }
        const user = await this.userService.findByUserId(userId);
        const totalBetAmount = betAmounts.reduce((sum, amount) => sum + amount, 0);
        if (mode === 'fun') {
            if (Number(user.balanceFun) < totalBetAmount) {
                throw new common_1.BadRequestException('Insufficient FunCoin balance');
            }
        }
        else {
            if (Number(user.balanceUsdt) < totalBetAmount) {
                throw new common_1.BadRequestException('Insufficient USDT balance');
            }
        }
        await this.userService.updateBalance(userId, mode, totalBetAmount, 'subtract');
        const result = this.generateResult(numbers, mode);
        const bets = [];
        let winAmount = 0;
        for (let i = 0; i < numbers.length; i++) {
            const won = numbers[i] === result;
            if (won) {
                const multiplier = mode === 'fun' ? this.FUN_WIN_MULTIPLIER : this.USDT_WIN_MULTIPLIER;
                winAmount += betAmounts[i] * multiplier;
            }
            bets.push({
                number: numbers[i],
                amount: betAmounts[i],
                won,
            });
        }
        let newBalance;
        if (winAmount > 0) {
            const updatedUser = await this.userService.updateBalance(userId, mode, winAmount, 'add');
            newBalance = Number(mode === 'fun' ? updatedUser.balanceFun : updatedUser.balanceUsdt);
        }
        else {
            const currentBalance = await this.userService.getBalance(userId);
            newBalance = mode === 'fun' ? currentBalance.balanceFun : currentBalance.balanceUsdt;
        }
        const gameHistory = this.gameHistoryRepository.create({
            userId,
            mode,
            bets,
            result,
            totalBetAmount,
            winAmount,
            balanceAfter: newBalance,
        });
        await this.gameHistoryRepository.save(gameHistory);
        this.logger.log(`Game played by ${userId}: mode=${mode}, result=${result}, win=${winAmount}`);
        return {
            result,
            bets,
            winAmount,
            newBalance,
            totalBetAmount,
        };
    }
    generateResult(userNumbers, mode) {
        const winRate = mode === 'fun' ? this.FUN_WIN_RATE : this.USDT_WIN_RATE;
        const shouldWin = Math.random() < winRate;
        if (shouldWin && userNumbers.length > 0) {
            const winningIndex = Math.floor(Math.random() * userNumbers.length);
            return userNumbers[winningIndex];
        }
        else {
            let result;
            do {
                const num = Math.floor(Math.random() * 100);
                result = num.toString().padStart(2, '0');
            } while (userNumbers.includes(result));
            return result;
        }
    }
    isValidNumber(num) {
        const parsed = parseInt(num, 10);
        return num.length === 2 && parsed >= 0 && parsed <= 99;
    }
    async getHistory(userId, limit = 50) {
        return this.gameHistoryRepository.find({
            where: { userId },
            order: { timestamp: 'DESC' },
            take: limit,
        });
    }
};
exports.GameService = GameService;
exports.GameService = GameService = GameService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(game_history_entity_1.GameHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        user_service_1.UserService])
], GameService);
//# sourceMappingURL=game.service.js.map