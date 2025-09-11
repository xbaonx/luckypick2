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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TxHistory = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let TxHistory = class TxHistory {
};
exports.TxHistory = TxHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TxHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TxHistory.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.txHistories),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], TxHistory.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        enum: ['deposit', 'withdraw', 'gom_funds'],
    }),
    __metadata("design:type", String)
], TxHistory.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TxHistory.prototype, "txHash", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TxHistory.prototype, "fromAddress", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TxHistory.prototype, "toAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 20, scale: 8 }),
    __metadata("design:type", Number)
], TxHistory.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'USDT' }),
    __metadata("design:type", String)
], TxHistory.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        enum: ['pending', 'confirmed', 'failed'],
        default: 'pending',
    }),
    __metadata("design:type", String)
], TxHistory.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], TxHistory.prototype, "blockNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TxHistory.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TxHistory.prototype, "createdAt", void 0);
exports.TxHistory = TxHistory = __decorate([
    (0, typeorm_1.Entity)('tx_histories')
], TxHistory);
//# sourceMappingURL=tx-history.entity.js.map