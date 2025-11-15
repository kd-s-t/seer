<div align="center"> 
	<a href="https://dorahacks.io" target="_blank">
		<img src="./seedify.png" width="100%" /> 
	</a>
</div>

<div align="center"> 
	<img src="./seerylogov3.png" width="200px" alt="Seery Logo" />
</div>

**Seery** is a decentralized crypto price prediction platform on BNB Chain that uses AI to generate price predictions for cryptocurrencies. Users can stake BNB on whether prices will go up or down within a specified time period. All staking data, predictions, and payouts are stored on-chain. The platform features a modern web interface with real-time market data, news integration, and comprehensive user analytics.

**Features:**
- **BNB Chain**: Mainnet and testnet support for all transactions
- **AI-Powered Predictions**: OpenAI generates price predictions for cryptocurrencies with direction and percentage change
- **On-Chain Staking**: All stakes are stored on blockchain smart contracts
- **Real-Time Market Data**: Live cryptocurrency prices from CoinGecko API
- **News Integration**: Crypto news feed from TheNewsAPI
- **User Profile**: Track wins, losses, net profit, and win rate
- **Admin Analytics**: Dashboard showing ongoing stakes, resolved stakes, unique stakers, and accuracy metrics
- **Modular Architecture**: Organized codebase with domain-specific modules

---  

<div align="center"> 
	<img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" /> 
	<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" /> 
	<img src="https://img.shields.io/badge/Material--UI-007FFF?style=for-the-badge&logo=mui&logoColor=white" /> 
	<img src="https://img.shields.io/badge/Framer%20Motion-EF008F?style=for-the-badge&logo=framer&logoColor=white" /> 
	<img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" /> 
	<img src="https://img.shields.io/badge/OpenAI-74aa9c?style=for-the-badge&logo=openai&logoColor=white" /> 
</div>

<div align="center"> 
	<img src="https://img.shields.io/badge/BNB_Chain-F3BA2F?style=for-the-badge&logo=binance&logoColor=black" />
	<img src="https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white" /> 
	<img src="https://img.shields.io/badge/Hardhat-FFF100?style=for-the-badge&logo=hardhat&logoColor=black" /> 
	<img src="https://img.shields.io/badge/wagmi-6366f1?style=for-the-badge&logo=ethereum&logoColor=white" />
	<img src="https://img.shields.io/badge/ethers.js-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white" /> 
	<img src="https://img.shields.io/badge/MetaMask-FF7139?style=for-the-badge&logo=metamask&logoColor=white" /> 
</div>

<div align="center"> 
	<img src="https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white" /> 
	<img src="https://img.shields.io/badge/terraform-%235835CC.svg?style=for-the-badge&logo=terraform&logoColor=white" /> 
	<img src="https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white" />
</div>

---  

## Project Structure

```
seer/
├── nextjs/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # Shared React components
│   ├── modules/          # Domain-specific modules
│   │   ├── news/         # News feed module
│   │   ├── market/       # Market predictions module
│   │   ├── staking/      # Staking module
│   │   ├── profile/      # User profile module
│   │   └── analytics/    # Admin analytics module
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Libraries and utilities
│   └── public/           # Static assets
├── expressjs/
│   ├── server.js         # Express API server
│   ├── controllers/      # API controllers
│   ├── routes/           # API routes
│   ├── lib/              # Libraries (blockchain, AI, news, etc.)
│   └── package.json
└── bnb/
    ├── contracts/        # Solidity contracts
    │   ├── main.sol      # Main contract
    │   ├── stakes/       # Staking contracts
    │   └── libraries/    # Contract libraries
    ├── scripts/          # Deployment scripts
    └── package.json
```

## Quick Start

### Prerequisites

- Node.js 22+ (LTS) and npm
- MetaMask browser extension
- BNB Chain testnet BNB (for testing)
- OpenAI API key (for AI features)

### Installation

**1. Clone the repository:**
```bash
git clone https://github.com/kd-s-t/seer.git
cd seer
```

**2. Set up and start services:**

- **Backend**: See [expressjs/README.md](expressjs/README.md) for detailed setup instructions
- **Frontend**: See [nextjs/README.md](nextjs/README.md) for detailed setup instructions
- **Smart Contracts**: See [bnb/README.md](bnb/README.md) for deployment instructions

## Docker

Run the entire stack with Docker:

```bash
docker-compose up
```

This starts both frontend and backend services.

---  

## Usage

### Viewing News

1. Navigate to the **News** page
2. Browse crypto news articles from TheNewsAPI
3. News is automatically filtered for cryptocurrency-related content

### Market Predictions

1. Connect your MetaMask wallet (BNB Chain testnet or mainnet)
2. Navigate to the **Market** page
3. View real-time cryptocurrency prices and AI-generated predictions
4. Click the refresh button to generate new AI predictions
5. Each prediction shows:
   - Current price vs predicted price
   - Direction (up/down) and percentage change
   - Expiration time
   - Total stakes for up/down directions

### Staking on Predictions

1. Navigate to the **Staking** page
2. Browse available stakeable predictions
3. Select a prediction and click "Stake"
4. Choose direction (Up or Down)
5. Enter stake amount (minimum 0.00001 BNB)
6. Confirm transaction in MetaMask
7. Your stake is recorded on-chain

### Viewing Profile

1. Navigate to the **Profile** page (requires wallet connection)
2. View your statistics:
   - Wins and losses
   - Net profit/loss
   - Win rate percentage
   - Total staked amount
3. View detailed history of all your stakes

### Admin Analytics

1. Connect as admin wallet (configured in backend)
2. Navigate to the **Analytics** page
3. View platform-wide metrics:
   - Ongoing stakes count
   - Resolved stakes count
   - Unique stakers
   - Correct predictions
   - Total amount staked
   - Accuracy rate

---  

## Implementation Details

### Smart Contracts

- **Stakes.sol**: Handles on-chain staking for crypto price predictions
- **main.sol**: Main contract for prediction management
- **Library.sol**: Shared library functions

**Deployed Contract Address (BNB Testnet):**
- `0xbB0383E1CE84C278a149AAb84F3aC7DE6687d2d6`

### Frontend Architecture

The Next.js frontend is organized into modular components:

- **modules/news**: News feed with crypto news aggregation
- **modules/market**: Market page with crypto prices and AI predictions
- **modules/staking**: Staking interface for predictions
- **modules/profile**: User profile with statistics and stake history
- **modules/analytics**: Admin dashboard with platform metrics

Each module follows a consistent structure:
- `components/`: React components
- `types.ts`: TypeScript interfaces
- `const.ts`: Constants
- `hooks.ts`: Custom React hooks
- `utils.ts`: Utility functions
- `index.ts`: Public exports

### Backend API

- **Express.js** server with RESTful API endpoints
- **OpenAI** integration for price predictions (paid)
- **BNB Chain** integration using ethers.js
- **CoinGecko** API for real-time crypto prices
- **TheNewsAPI** for crypto news aggregation (paid)

### On-Chain Storage

All staking data is stored on BNB Chain:
- User stakes (amount, direction, prediction ID)
- Prediction data (crypto ID, current price, predicted price, expiration)
- Staker information (wallet address, stake amounts, timestamps)
- Resolution status and rewards

**Built for Seedify Predictions Market Hackathon**

## Team

- [@kenn](https://www.linkedin.com/in/kdst/)
- [@don](https://www.linkedin.com/in/carl-john-don-sebial-882430187/)
- [@peter](https://www.linkedin.com/in/petertibon/)
