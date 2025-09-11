#!/usr/bin/env ts-node

import * as CryptoJS from 'crypto-js';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('=================================');
  console.log('   Seed Phrase Encryption Tool   ');
  console.log('=================================\n');

  console.log('⚠️  WARNING: This tool will encrypt your seed phrase.');
  console.log('Make sure to store your seed phrase securely offline.\n');

  try {
    // Get seed phrase
    const seedPhrase = await question('Enter your seed phrase (12 or 24 words): ');
    const words = seedPhrase.trim().split(/\s+/);
    
    if (words.length !== 12 && words.length !== 24) {
      throw new Error('Seed phrase must be 12 or 24 words');
    }

    // Get encryption key
    const secretKey = await question('Enter your encryption key (min 32 chars): ');
    
    if (secretKey.length < 32) {
      throw new Error('Encryption key must be at least 32 characters');
    }

    // Confirm
    const confirm = await question('\nAre you sure you want to encrypt this seed? (yes/no): ');
    
    if (confirm.toLowerCase() !== 'yes') {
      console.log('Operation cancelled.');
      process.exit(0);
    }

    // Encrypt seed phrase
    const encrypted = CryptoJS.AES.encrypt(seedPhrase.trim(), secretKey).toString();

    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Save encrypted seed
    const seedPath = path.join(dataDir, 'seed.enc');
    fs.writeFileSync(seedPath, encrypted);

    console.log('\n✅ Seed phrase encrypted successfully!');
    console.log(`📁 Saved to: ${seedPath}`);
    console.log('\n⚠️  IMPORTANT:');
    console.log('1. Store your original seed phrase securely offline');
    console.log('2. Remember your encryption key (SECRET_KEY)');
    console.log('3. Set SECRET_KEY in your .env file');
    console.log(`4. Example: SECRET_KEY="${secretKey}"`);

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Test decryption function
export function decryptSeed(encryptedSeed: string, secretKey: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedSeed, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    throw new Error('Failed to decrypt seed. Invalid key or corrupted data.');
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
