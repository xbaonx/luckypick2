#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const CryptoJS = require("crypto-js");
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
function question(query) {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
}
async function main() {
    console.log('=== LuckyPick2 Seed Phrase Encryption Tool ===\n');
    try {
        const seedPhrase = await question('Enter your seed phrase (12 or 24 words): ');
        if (!seedPhrase || seedPhrase.split(' ').length < 12) {
            console.error('Invalid seed phrase. Must be at least 12 words.');
            process.exit(1);
        }
        const secretKey = await question('Enter your SECRET_KEY for encryption: ');
        if (!secretKey || secretKey.length < 16) {
            console.error('Secret key must be at least 16 characters long.');
            process.exit(1);
        }
        const encryptedSeed = CryptoJS.AES.encrypt(seedPhrase, secretKey).toString();
        const dataDir = '/data';
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        const seedFilePath = path.join(dataDir, 'seed.enc');
        fs.writeFileSync(seedFilePath, encryptedSeed);
        console.log('\n✅ Seed phrase encrypted successfully!');
        console.log(`📁 Encrypted file saved to: ${seedFilePath}`);
        console.log('\n⚠️  IMPORTANT:');
        console.log('1. Keep your SECRET_KEY safe - you need it to decrypt the seed');
        console.log('2. Add SECRET_KEY to your environment variables on Render');
        console.log('3. Never commit the seed.enc file or SECRET_KEY to git');
        console.log('4. Back up your seed phrase securely offline');
        const testDecrypt = CryptoJS.AES.decrypt(encryptedSeed, secretKey).toString(CryptoJS.enc.Utf8);
        if (testDecrypt === seedPhrase) {
            console.log('\n✅ Encryption verified successfully!');
        }
        else {
            console.error('\n❌ Encryption verification failed!');
            process.exit(1);
        }
    }
    catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
    finally {
        rl.close();
    }
}
main();
//# sourceMappingURL=encrypt-seed.js.map