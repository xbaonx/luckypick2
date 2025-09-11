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
var SecurityService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const CryptoJS = require("crypto-js");
const fs = require("fs");
let SecurityService = SecurityService_1 = class SecurityService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(SecurityService_1.name);
        this.seedFilePath = '/data/seed.enc';
    }
    async onModuleInit() {
        const secretKey = this.configService.get('SECRET_KEY');
        if (!secretKey) {
            this.logger.error('SECRET_KEY environment variable is required for seed phrase decryption');
            throw new Error('SECRET_KEY environment variable is required');
        }
        await this.loadSeedPhrase();
    }
    async loadSeedPhrase() {
        try {
            if (!fs.existsSync(this.seedFilePath)) {
                this.logger.error('Encrypted seed file not found at /data/seed.enc');
                this.logger.error('Please upload your encrypted seed file to /data/seed.enc');
                this.logger.error('Use: npm run seed:encrypt to create the encrypted seed file');
                throw new Error('Encrypted seed file not found at /data/seed.enc');
            }
            const encryptedSeed = fs.readFileSync(this.seedFilePath, 'utf8');
            const secretKey = this.configService.get('SECRET_KEY');
            this.seedPhrase = this.decryptData(encryptedSeed, secretKey);
            if (!this.seedPhrase) {
                throw new Error('Failed to decrypt seed phrase');
            }
            this.logger.log('Seed phrase loaded successfully');
        }
        catch (error) {
            this.logger.error('Failed to load seed phrase:', error);
            throw error;
        }
    }
    getSeedPhrase() {
        if (!this.seedPhrase) {
            throw new Error('Seed phrase not loaded');
        }
        return this.seedPhrase;
    }
    encryptData(data, secretKey) {
        return CryptoJS.AES.encrypt(data, secretKey).toString();
    }
    decryptData(encryptedData, secretKey) {
        const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    }
    hashData(data) {
        return CryptoJS.SHA256(data).toString();
    }
};
exports.SecurityService = SecurityService;
exports.SecurityService = SecurityService = SecurityService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SecurityService);
//# sourceMappingURL=security.service.js.map