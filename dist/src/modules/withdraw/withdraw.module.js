"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const withdraw_service_1 = require("./withdraw.service");
const withdraw_controller_1 = require("./withdraw.controller");
const tx_history_entity_1 = require("../../entities/tx-history.entity");
const user_module_1 = require("../user/user.module");
const wallet_module_1 = require("../wallet/wallet.module");
let WithdrawModule = class WithdrawModule {
};
exports.WithdrawModule = WithdrawModule;
exports.WithdrawModule = WithdrawModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([tx_history_entity_1.TxHistory]), user_module_1.UserModule, wallet_module_1.WalletModule],
        controllers: [withdraw_controller_1.WithdrawController],
        providers: [withdraw_service_1.WithdrawService],
        exports: [withdraw_service_1.WithdrawService],
    })
], WithdrawModule);
//# sourceMappingURL=withdraw.module.js.map