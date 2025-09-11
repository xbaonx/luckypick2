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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("./user.service");
const register_user_dto_1 = require("../../dto/register-user.dto");
let UserController = class UserController {
    constructor(userService) {
        this.userService = userService;
    }
    async register(dto) {
        try {
            const user = await this.userService.register(dto.userId);
            return {
                success: true,
                user: {
                    id: user.id,
                    userId: user.userId,
                    address: user.address,
                    balanceFun: user.balanceFun,
                    balanceUsdt: user.balanceUsdt,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async getBalance(userId) {
        return this.userService.getBalance(userId);
    }
    async getUser(userId) {
        const user = await this.userService.findByUserId(userId);
        return {
            id: user.id,
            userId: user.userId,
            address: user.address,
            balanceFun: user.balanceFun,
            balanceUsdt: user.balanceUsdt,
            createdAt: user.createdAt,
        };
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_user_dto_1.RegisterUserDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "register", null);
__decorate([
    (0, common_1.Get)('balance/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Get)(':userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUser", null);
exports.UserController = UserController = __decorate([
    (0, common_1.Controller)('api/user'),
    __metadata("design:paramtypes", [user_service_1.UserService])
], UserController);
//# sourceMappingURL=user.controller.js.map