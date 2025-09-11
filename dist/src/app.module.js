"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const security_module_1 = require("./modules/security/security.module");
const wallet_module_1 = require("./modules/wallet/wallet.module");
const user_module_1 = require("./modules/user/user.module");
const game_module_1 = require("./modules/game/game.module");
const withdraw_module_1 = require("./modules/withdraw/withdraw.module");
const cron_module_1 = require("./modules/cron/cron.module");
const user_entity_1 = require("./entities/user.entity");
const game_history_entity_1 = require("./entities/game-history.entity");
const tx_history_entity_1 = require("./entities/tx-history.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    type: 'sqlite',
                    database: configService.get('DATABASE_PATH', '/data/luckypick2.db'),
                    entities: [user_entity_1.User, game_history_entity_1.GameHistory, tx_history_entity_1.TxHistory],
                    synchronize: configService.get('NODE_ENV') !== 'production',
                    logging: configService.get('NODE_ENV') !== 'production',
                }),
                inject: [config_1.ConfigService],
            }),
            schedule_1.ScheduleModule.forRoot(),
            security_module_1.SecurityModule,
            wallet_module_1.WalletModule,
            user_module_1.UserModule,
            game_module_1.GameModule,
            withdraw_module_1.WithdrawModule,
            cron_module_1.CronModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map