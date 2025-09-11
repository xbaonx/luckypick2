import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class SecurityService implements OnModuleInit {
    private configService;
    private readonly logger;
    private seedPhrase;
    private readonly seedFilePath;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    private loadSeedPhrase;
    getSeedPhrase(): string;
    encryptData(data: string, secretKey: string): string;
    decryptData(encryptedData: string, secretKey: string): string;
    hashData(data: string): string;
}
