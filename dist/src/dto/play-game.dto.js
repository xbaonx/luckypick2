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
exports.PlayGameDto = void 0;
const class_validator_1 = require("class-validator");
class PlayGameDto {
}
exports.PlayGameDto = PlayGameDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PlayGameDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['fun', 'usdt']),
    __metadata("design:type", String)
], PlayGameDto.prototype, "mode", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(10),
    (0, class_validator_1.Matches)(/^[0-9]{2}$/, { each: true }),
    __metadata("design:type", Array)
], PlayGameDto.prototype, "numbers", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(10),
    (0, class_validator_1.IsNumber)({}, { each: true }),
    (0, class_validator_1.Min)(1, { each: true }),
    __metadata("design:type", Array)
], PlayGameDto.prototype, "betAmounts", void 0);
//# sourceMappingURL=play-game.dto.js.map