"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const cron_service_1 = require("./cron.service");
const user_entity_1 = require("../../entities/user.entity");
const tx_history_entity_1 = require("../../entities/tx-history.entity");
const user_module_1 = require("../user/user.module");
const wallet_module_1 = require("../wallet/wallet.module");
let CronModule = class CronModule {
};
exports.CronModule = CronModule;
exports.CronModule = CronModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, tx_history_entity_1.TxHistory]),
            user_module_1.UserModule,
            wallet_module_1.WalletModule,
        ],
        providers: [cron_service_1.CronService],
        exports: [cron_service_1.CronService],
    })
], CronModule);
//# sourceMappingURL=cron.module.js.map