import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as CryptoJS from 'crypto-js';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WalletService {
  private provider: ethers.JsonRpcProvider;
  private adminWallet: ethers.HDNodeWallet;
  private seedPhrase: string;
  private dataDir: string;

  constructor(private configService: ConfigService) {
    this.provider = new ethers.JsonRpcProvider(
      this.configService.get<string>('RPC_URL')
    );
    // Determine data directory for persistent storage
    // Priority: DATA_DIR env -> /mnt/data (if exists) -> /data
    const configuredDir = this.configService.get<string>('DATA_DIR');
    this.dataDir = configuredDir || (fs.existsSync('/mnt/data') ? '/mnt/data' : '/data');
    this.initializeWallet();
  }

  private initializeWallet() {
    try {
      // Resolve seed path with fallback
      const preferredSeedPath = path.join(this.dataDir, 'seed.enc');
      let seedPath = preferredSeedPath;
      if (!fs.existsSync(seedPath)) {
        const altPath = path.join('/mnt/data', 'seed.enc');
        if (fs.existsSync(altPath)) {
          seedPath = altPath;
        }
      }

      if (fs.existsSync(seedPath)) {
        const encryptedSeed = fs.readFileSync(seedPath, 'utf8');
        const secretKey = this.configService.get<string>('SECRET_KEY');
        this.seedPhrase = this.decryptSeed(encryptedSeed, secretKey);
        
        // Create admin wallet from seed phrase
        this.adminWallet = ethers.Wallet.fromPhrase(this.seedPhrase).connect(this.provider);
      }
    } catch (error) {
      console.error('Failed to initialize wallet:', error);
    }
  }

  private encryptSeed(seedPhrase: string, secretKey: string): string {
    return CryptoJS.AES.encrypt(seedPhrase, secretKey).toString();
  }

  private decryptSeed(encryptedSeed: string, secretKey: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedSeed, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  async saveSeedPhrase(seedPhrase: string): Promise<void> {
    const secretKey = this.configService.get<string>('SECRET_KEY');
    const encryptedSeed = this.encryptSeed(seedPhrase, secretKey);
    
    const dataDir = this.dataDir;
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(dataDir, 'seed.enc'), encryptedSeed);
    this.seedPhrase = seedPhrase;
    this.adminWallet = ethers.Wallet.fromPhrase(seedPhrase).connect(this.provider);
  }

  async deriveAddress(index: number): Promise<string> {
    if (!this.seedPhrase) {
      throw new Error('Seed phrase not initialized');
    }
    
    // Use Mnemonic + HDNodeWallet.fromMnemonic to derive from ROOT using absolute path
    const path = `m/44'/60'/0'/0/${index}`;
    const mnemonic = ethers.Mnemonic.fromPhrase(this.seedPhrase);
    const walletAtIndex = ethers.HDNodeWallet.fromMnemonic(mnemonic, path);
    return walletAtIndex.address;
  }

  async derivePrivateKey(index: number): Promise<string> {
    if (!this.seedPhrase) {
      throw new Error('Seed phrase not initialized');
    }
    
    const path = `m/44'/60'/0'/0/${index}`;
    const mnemonic = ethers.Mnemonic.fromPhrase(this.seedPhrase);
    const walletAtIndex = ethers.HDNodeWallet.fromMnemonic(mnemonic, path);
    return walletAtIndex.privateKey;
  }

  async getBalance(address: string, tokenAddress?: string): Promise<string> {
    if (tokenAddress) {
      // Get ERC20 token balance
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address) view returns (uint256)'],
        this.provider
      );
      const balance = await tokenContract.balanceOf(address);
      return ethers.formatUnits(balance, 6); // USDT has 6 decimals
    } else {
      // Get native balance
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    }
  }

  async checkDeposit(address: string): Promise<number> {
    const tokenAddress = this.configService.get<string>('TOKEN_ADDRESS');
    const balance = await this.getBalance(address, tokenAddress);
    return parseFloat(balance);
  }

  async gomFunds(fromIndex: number, amount: string): Promise<string> {
    try {
      const privateKey = await this.derivePrivateKey(fromIndex);
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const tokenAddress = this.configService.get<string>('TOKEN_ADDRESS');
      const adminAddress = this.configService.get<string>('ADMIN_ADDRESS');

      // Create token contract
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          'function transfer(address to, uint256 amount) returns (bool)',
          'function balanceOf(address) view returns (uint256)'
        ],
        wallet
      );

      // Check balance first
      const balance = await tokenContract.balanceOf(wallet.address);
      if (balance < ethers.parseUnits(amount, 6)) {
        throw new Error('Insufficient balance');
      }

      // Transfer tokens to admin wallet
      const tx = await tokenContract.transfer(
        adminAddress,
        ethers.parseUnits(amount, 6)
      );
      
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Gom funds error:', error);
      throw error;
    }
  }

  async sendTransaction(
    toAddress: string,
    amount: string,
    isToken: boolean = true
  ): Promise<string> {
    try {
      if (!this.adminWallet) {
        throw new Error('Admin wallet not initialized');
      }

      if (isToken) {
        const tokenAddress = this.configService.get<string>('TOKEN_ADDRESS');
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ['function transfer(address to, uint256 amount) returns (bool)'],
          this.adminWallet
        );

        const tx = await tokenContract.transfer(
          toAddress,
          ethers.parseUnits(amount, 6)
        );
        const receipt = await tx.wait();
        return receipt.hash;
      } else {
        const tx = await this.adminWallet.sendTransaction({
          to: toAddress,
          value: ethers.parseEther(amount),
        });
        const receipt = await tx.wait();
        return receipt.hash;
      }
    } catch (error) {
      console.error('Send transaction error:', error);
      throw error;
    }
  }

  async getTransactionReceipt(txHash: string) {
    return await this.provider.getTransactionReceipt(txHash);
  }

  getAdminAddress(): string {
    return this.adminWallet ? this.adminWallet.address : null;
  }

  async checkGasBalance(address: string): Promise<boolean> {
    const balance = await this.provider.getBalance(address);
    const minGas = ethers.parseEther('0.001'); // Minimum 0.001 BNB for gas
    return balance > minGas;
  }

  // --- Event-based deposit helpers ---
  async getCurrentBlock(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  async getUsdtTransferEvents(fromBlock: number, toBlock: number): Promise<Array<{
    txHash: string;
    from: string;
    to: string;
    amount: string; // human-readable (6 decimals)
    blockNumber: number;
  }>> {
    const tokenAddress = this.configService.get<string>('TOKEN_ADDRESS');
    if (!tokenAddress) throw new Error('TOKEN_ADDRESS not configured');

    const iface = new ethers.Interface([
      'event Transfer(address indexed from, address indexed to, uint256 value)'
    ]);
    const transferTopic = ethers.id('Transfer(address,address,uint256)');

    const logs = await this.provider.getLogs({
      address: tokenAddress,
      topics: [transferTopic],
      fromBlock,
      toBlock,
    });

    return logs.map((log) => {
      const parsed = iface.parseLog({
        topics: Array.from(log.topics),
        data: log.data,
      });
      const value = parsed.args[2] as bigint;
      return {
        txHash: log.transactionHash,
        from: (parsed.args[0] as string).toLowerCase(),
        to: (parsed.args[1] as string).toLowerCase(),
        amount: ethers.formatUnits(value, 6),
        blockNumber: log.blockNumber!,
      };
    });
  }
}
