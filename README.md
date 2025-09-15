# LuckyPick2 - Web3 Gaming Platform

A full-stack web application for Lucky Pick 2 gaming with FunCoin and USDT support, built with NestJS and React.

## 🎮 Features

### Player Features
- **Guest Mode**: Play with 1000 free FunCoins
- **Registered Mode**: Play with real USDT
- **Lucky Pick 2 Game**: Select numbers 00-99 and win big
- **Transak Integration**: Easy USDT deposits
- **Instant Withdrawals**: Cash out winnings to any wallet
- **Game History**: Track all your games

### Admin Features
- **Dashboard**: Real-time statistics and metrics
- **User Management**: View and manage all users
- **Withdrawal Approval**: Review and process withdrawals
- **Game Configuration**: Adjust win rates and payouts
- **Wallet Management**: Secure HD wallet with seed encryption

## 🚀 Tech Stack

- **Backend**: NestJS, TypeScript, TypeORM, SQLite
- **Frontend**: React, Vite, TailwindCSS, Zustand
- **Blockchain**: Binance Smart Chain, ethers.js
- **Payment**: Transak integration
- **Security**: AES-256 encryption, JWT authentication

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- BSC wallet with admin privileges
- Transak (or other on-ramp) account if needed for USDT deposits

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/luckypick2.git
cd luckypick2
```

### 2. Install dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Setup

Create `.env` file in the backend directory:

```env
# Database
DATABASE_PATH=/data/luckypick2.db

# Blockchain
RPC_URL=https://bsc-dataseed.binance.org/
ADMIN_ADDRESS=0x_YOUR_ADMIN_WALLET_ADDRESS
TOKEN_ADDRESS=0x55d398326f99059fF775485246999027B3197955
SECRET_KEY=your-secret-key-for-encryption-32chars

# JWT
JWT_SECRET=your-jwt-secret-key

# MoonPay removed

# Admin
ADMIN_EMAIL=admin@luckypick2.com
ADMIN_PASSWORD=admin123456

# App
PORT=3000
NODE_ENV=development
```

### 4. Setup Wallet Seed

#### Option A: Using the encryption script
```bash
cd scripts
npx ts-node encrypt-seed.ts
```

Follow the prompts to enter your seed phrase and encryption key.

#### Option B: Through Admin Panel
1. Start the application
2. Login as admin
3. Navigate to Admin > Seed Setup
4. Enter your seed phrase

### 5. Create Data Directory

```bash
mkdir -p data
```

## 🏃‍♂️ Running the Application

### Development Mode

```bash
# Terminal 1 - Run backend
cd backend
npm run start:dev

# Terminal 2 - Run frontend
cd frontend
npm run dev
```

- Backend: http://localhost:3000
- Frontend: http://localhost:5173

### Production Mode

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build

# Start production server
cd backend
npm run start:prod
```

## 🎮 Game Rules

### FunCoin Mode
- Initial balance: 1000 FunCoins
- Win rate: 5% (1/20)
- Payout: 10x bet amount
- No registration required

### USDT Mode
- Requires registration
- Win rate: 1% (1/100)
- Payout: 70x bet amount
- Real money gaming

## 🔐 Security

### Seed Phrase Encryption
- Seed phrases are encrypted using AES-256
- Stored in `/data/seed.enc`
- Decryption requires SECRET_KEY from environment

### Best Practices
- Never commit `.env` file
- Use strong SECRET_KEY (32+ characters)
- Store seed phrase backup offline
- Regularly rotate JWT secrets
- Monitor admin wallet balance

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/guest` - Create guest session
- `GET /api/auth/profile` - Get user profile

### Game
- `POST /api/game/play` - Play game
- `GET /api/game/history` - Get game history
- `GET /api/game/stats` - Get game statistics

### User
- `GET /api/users/profile` - Get user profile
- `GET /api/users/balance` - Get user balance

### Wallet
- `POST /api/withdraw/request` - Request withdrawal
- `GET /api/withdraw/my-requests` - Get withdrawal history

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/config` - Get configurations
- `PUT /api/admin/config/:key` - Update configuration
- `POST /api/withdraw/:id/approve` - Approve withdrawal
- `POST /api/withdraw/:id/reject` - Reject withdrawal

## 🚢 Deployment on Render

### 1. Push to GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Setup on Render
1. Create a new Web Service
2. Connect your GitHub repository
3. Use the provided `render.yaml` configuration
4. Add environment variables in Render dashboard
5. Create a persistent disk mounted at `/data`

### 3. Environment Variables on Render
Set these in the Render dashboard:
- `ADMIN_ADDRESS` - Your admin wallet address
- `SECRET_KEY` - 32+ character encryption key
  (MoonPay environment variables removed)
- `ADMIN_PASSWORD` - Secure admin password

## 📊 Database Schema

### Users
- `id` - UUID
- `type` - guest/registered
- `email` - User email
- `passwordHash` - Bcrypt hash
- `walletAddress` - Derived wallet
- `walletIndex` - HD wallet index
- `balanceFun` - FunCoin balance
- `balanceUsdt` - USDT balance

### GameHistory
- `id` - UUID
- `userId` - User reference
- `mode` - fun/usdt
- `numbers` - Selected numbers
- `betAmounts` - Bet amounts
- `result` - Winning number
- `winAmount` - Payout amount
- `isWin` - Win status

### WithdrawRequest
- `id` - UUID
- `userId` - User reference
- `amount` - USDT amount
- `toAddress` - Destination wallet
- `status` - pending/approved/rejected/completed
- `txHash` - Transaction hash

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test
npm run test:e2e

# Frontend tests
cd frontend
npm run test
```

## 🔧 Troubleshooting

### Database Issues
```bash
# Reset database
rm data/luckypick2.db
# Restart application - will auto-create new DB
```

### Seed Phrase Issues
- Ensure SECRET_KEY matches in .env
- Check seed.enc exists in /data directory
- Verify seed phrase is 12 or 24 words

### Deposit Not Showing
- Wait 1-2 minutes for automatic scan
- Check wallet address is correct
- Verify USDT is on BSC network

## 📝 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📧 Support

For support, email support@luckypick2.com

## ⚠️ Disclaimer

This application is for educational purposes. Please comply with local gambling regulations.
