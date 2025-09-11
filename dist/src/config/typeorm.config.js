"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const config_1 = require("@nestjs/config");
const dotenv_1 = require("dotenv");
const user_entity_1 = require("../entities/user.entity");
const game_history_entity_1 = require("../entities/game-history.entity");
const tx_history_entity_1 = require("../entities/tx-history.entity");
(0, dotenv_1.config)();
const configService = new config_1.ConfigService();
exports.default = new typeorm_1.DataSource({
    type: 'sqlite',
    database: '/data/luckypick2.db',
    entities: [user_entity_1.User, game_history_entity_1.GameHistory, tx_history_entity_1.TxHistory],
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
});
//# sourceMappingURL=typeorm.config.js.map