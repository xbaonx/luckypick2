import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { SecurityService } from '../security/security.service';
export declare class WalletService {
    private readonly configService;
    private readonly securityService;
    private readonly logger;
    private provider;
    private adminWallet;
    private usdtContract;
    private readonly USDT_ABI;
    constructor(configService: ConfigService, securityService: SecurityService);
    private validateConfiguration;
    private initializeProvider;
    deriveWallet(index: number): {
        address: string;
        privateKey: string;
    };
    getWalletInstance(index: number): ethers.Wallet;
    getAdminWallet(): ethers.Wallet;
    getUsdtBalance(address: string): Promise<string>;
    getNativeBalance(address: string): Promise<string>;
    transferUsdt(fromWalletIndex: number, toAddress: string, amount: string): Promise<{
        success: boolean;
        txHash?: string;
        error?: string;
    }>;
    gomFunds(fromWalletIndex: number, amount: string): Promise<{
        success: boolean;
        txHash?: string;
        error?: string;
    }>;
    sendGasToWallet(toAddress: string, amount?: string): Promise<{
        success: boolean;
        txHash?: string;
        error?: string;
    }>;
}
