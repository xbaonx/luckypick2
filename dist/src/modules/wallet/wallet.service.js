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
var WalletService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ethers_1 = require("ethers");
const bip39 = require("bip39");
const hdkey_1 = require("hdkey");
const security_service_1 = require("../security/security.service");
let WalletService = WalletService_1 = class WalletService {
    constructor(configService, securityService) {
        this.configService = configService;
        this.securityService = securityService;
        this.logger = new common_1.Logger(WalletService_1.name);
        this.USDT_ABI = [
            'function balanceOf(address owner) view returns (uint256)',
            'function transfer(address to, uint256 amount) returns (bool)',
            'function decimals() view returns (uint8)',
        ];
        this.validateConfiguration();
        this.initializeProvider();
    }
    validateConfiguration() {
        const required = ['RPC_URL', 'TOKEN_ADDRESS', 'ADMIN_ADDRESS'];
        const missing = required.filter(key => !this.configService.get(key));
        if (missing.length > 0) {
            this.logger.error(`Missing required environment variables: ${missing.join(', ')}`);
            this.logger.error('Please set the following environment variables:');
            this.logger.error('- RPC_URL: Blockchain RPC endpoint (e.g., https://bsc-dataseed.binance.org/)');
            this.logger.error('- TOKEN_ADDRESS: USDT contract address');
            this.logger.error('- ADMIN_ADDRESS: Admin wallet address');
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }
    initializeProvider() {
        try {
            const rpcUrl = this.configService.get('RPC_URL');
            const tokenAddress = this.configService.get('TOKEN_ADDRESS');
            if (!rpcUrl) {
                throw new Error('RPC_URL environment variable is required');
            }
            if (!tokenAddress) {
                throw new Error('TOKEN_ADDRESS environment variable is required');
            }
            this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
            this.usdtContract = new ethers_1.ethers.Contract(tokenAddress, this.USDT_ABI, this.provider);
            this.logger.log(`Wallet service initialized with RPC: ${rpcUrl}`);
            this.logger.log(`USDT Contract: ${tokenAddress}`);
        }
        catch (error) {
            this.logger.error('Failed to initialize wallet service:', error.message);
            throw error;
        }
    }
    deriveWallet(index) {
        try {
            const seedPhrase = this.securityService.getSeedPhrase();
            const seed = bip39.mnemonicToSeedSync(seedPhrase);
            const hdkey = hdkey_1.HDKey.fromMasterSeed(seed);
            const path = `m/44'/60'/0'/0/${index}`;
            const childKey = hdkey.derive(path);
            const privateKey = '0x' + childKey.privateKey.toString('hex');
            const wallet = new ethers_1.ethers.Wallet(privateKey);
            return {
                address: wallet.address,
                privateKey: privateKey,
            };
        }
        catch (error) {
            this.logger.error(`Failed to derive wallet for index ${index}:`, error);
            throw error;
        }
    }
    getWalletInstance(index) {
        const { privateKey } = this.deriveWallet(index);
        return new ethers_1.ethers.Wallet(privateKey, this.provider);
    }
    getAdminWallet() {
        if (!this.adminWallet) {
            const { privateKey } = this.deriveWallet(0);
            this.adminWallet = new ethers_1.ethers.Wallet(privateKey, this.provider);
        }
        return this.adminWallet;
    }
    async getUsdtBalance(address) {
        try {
            const balance = await this.usdtContract.balanceOf(address);
            const decimals = await this.usdtContract.decimals();
            return ethers_1.ethers.formatUnits(balance, decimals);
        }
        catch (error) {
            this.logger.error(`Failed to get USDT balance for ${address}:`, error);
            return '0';
        }
    }
    async getNativeBalance(address) {
        try {
            const balance = await this.provider.getBalance(address);
            return ethers_1.ethers.formatEther(balance);
        }
        catch (error) {
            this.logger.error(`Failed to get native balance for ${address}:`, error);
            return '0';
        }
    }
    async transferUsdt(fromWalletIndex, toAddress, amount) {
        try {
            const wallet = this.getWalletInstance(fromWalletIndex);
            const contractWithSigner = this.usdtContract.connect(wallet);
            const decimals = await this.usdtContract.decimals();
            const amountInWei = ethers_1.ethers.parseUnits(amount, decimals);
            const gasBalance = await this.getNativeBalance(wallet.address);
            if (parseFloat(gasBalance) < 0.001) {
                return {
                    success: false,
                    error: `Insufficient gas in wallet ${wallet.address}. Balance: ${gasBalance}`,
                };
            }
            const tx = await contractWithSigner['transfer'](toAddress, amountInWei);
            await tx.wait();
            return {
                success: true,
                txHash: tx.hash,
            };
        }
        catch (error) {
            this.logger.error('Failed to transfer USDT:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async gomFunds(fromWalletIndex, amount) {
        try {
            const adminAddress = this.configService.get('ADMIN_ADDRESS');
            return await this.transferUsdt(fromWalletIndex, adminAddress, amount);
        }
        catch (error) {
            this.logger.error('Failed to gom funds:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async sendGasToWallet(toAddress, amount = '0.002') {
        try {
            const adminWallet = this.getAdminWallet();
            const tx = await adminWallet.sendTransaction({
                to: toAddress,
                value: ethers_1.ethers.parseEther(amount),
            });
            await tx.wait();
            return {
                success: true,
                txHash: tx.hash,
            };
        }
        catch (error) {
            this.logger.error('Failed to send gas:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = WalletService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        security_service_1.SecurityService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map