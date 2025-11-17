<div align="center"> 
	<a href="https://dorahacks.io" target="_blank">
		<img src="./seedify.png" width="100%" /> 
	</a>
</div>

<div align="center"> 
	<img src="./seerylogov3.png" width="200px" alt="Seery Logo" />
</div>

**Seery** is a decentralized crypto prediction platform that combines AI-powered forecasts with on-chain staking to make market participation simple, transparent, and rewarding. Users can stake BNB on whether a cryptocurrency’s price will rise or fall within 24 hours, with all stakes and payouts recorded directly on the BNB Chain. The platform solves the problem of opaque prediction systems by using verifiable on-chain transactions and hybrid oracle feeds from Chainlink and Pyth for accurate, automated market resolution. Seery targets crypto traders, beginners seeking guided insights, and DeFi users who want transparent, trustless prediction markets enhanced by AI-driven analysis.



**Features:**

**Hackathon Core Requirements:**
- **BNB Chain Integration**: Full mainnet and testnet support for all on-chain transactions (Required)
- **AI-Powered Predictions**: OpenAI generates price predictions with direction and percentage change (AI Integration)
- **On-Chain Staking**: All stakes stored on blockchain smart contracts with individual stake tracking (Blockchain Integration)
- **User Interaction**: Modern web interface with wallet connection, market browsing, and staking (User Interaction)

**YZi Labs Preferred Track - AI-Assisted Oracles:**
- **AI-Assisted Oracle Integration**: Chainlink and Pyth Network oracles for faster, contextual price resolution (24h vs traditional 24-48h)
- **Hybrid Oracle System**: Chainlink for major coins (BTC, ETH, BNB), Pyth Network for altcoins (SOL, XRP, ADA, etc.), CoinGecko fallback
- **Auto-Resolution System**: Automated cron job resolves expired stakes using oracle price feeds without manual intervention
- **Reward Distribution**: Automatic reward distribution to winning stakers based on prediction accuracy

**Additional Features:**
- **24-Hour Prediction Window**: Each prediction expires after 24 hours for resolution
- **Multiple Stakers**: Support for multiple users staking on the same prediction (up/down pools)
- **Real-Time Market Data**: Live cryptocurrency prices from CoinGecko API
- **News API Integration**: Crypto news feed from TheNewsAPI for market context
- **User Profile**: Track wins, losses, net profit, and win rate
- **Admin Analytics**: Dashboard showing ongoing stakes, resolved stakes, unique stakers, and accuracy metrics

**Future Features:**
- **Buy and Sell**: Direct cryptocurrency trading functionality within the platform
- **Enhanced News Integration**: Multiple news APIs will be integrated to provide richer data feeds for OpenAI analysis, improving prediction accuracy and market context
- **Domain Separation**: Separate domains for mainnet and testnet deployments (mainnet.theseery.com and testnet.theseery.com)

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

## 5-Minute Demo

<div align="center">
	<a href="https://drive.google.com/file/d/1CYyGCiKw3f5tB9xWkWkaQ8ZMhaPpVCor/view?usp=sharing" target="_blank">
		<img src="https://img.shields.io/badge/Google%20Drive-4285F4?style=for-the-badge&logo=googledrive&logoColor=white" alt="Watch 5-Minute Demo" />
	</a>
</div>

## Quick Use

The live deployment at [theseery.com](https://theseery.com) uses **BNB Smart Chain Testnet** for all on-chain transactions.

**BNB Smart Chain Testnet RPC:**
- RPC URL: `https://data-seed-prebsc-1-s1.binance.org:8545`
- Chain ID: `97` (0x61 in hexadecimal)
- Block Explorer: [BSCScan Testnet](https://testnet.bscscan.com)

**To connect MetaMask:**
1. Open MetaMask and click the network dropdown
2. Select "Add Network" or "Add a network manually"
3. Enter the following details:
   - **Network Name:** BNB Smart Chain Testnet
   - **New RPC URL:** `https://data-seed-prebsc-1-s1.binance.org:8545`
   - **Chain ID:** `97`
   - **Currency Symbol:** `tBNB`
   - **Block Explorer URL:** `https://testnet.bscscan.com`
4. Click "Save" and switch to the testnet network

**Get Testnet BNB (tBNB):**
- [BNB Smart Chain Testnet Faucet](https://testnet.binance.org/faucet-smart) - Official Binance testnet faucet
- You'll need testnet BNB to pay for gas fees when staking on predictions

## Quick Start

### Prerequisites

- Node.js 22+ (LTS) and npm
- MetaMask browser extension
- BNB Chain testnet BNB (for testing)
- OpenAI API key (for AI features)

### Installation

**⚠️ Warning:** This project requires API keys for full functionality. Without the required API keys, some features may not work:
- **OpenAI API Key** - Required for AI-powered predictions and market generation
- **TheNewsAPI Key** - Required for crypto news aggregation (optional, can be disabled)

**1. Clone the repository:**
```bash
git clone https://github.com/kd-s-t/seery.git
cd seery
```

**2. Set up and start services:**

- **Backend**: See [expressjs/README.md](expressjs/README.md) for detailed setup instructions
- **Frontend**: See [nextjs/README.md](nextjs/README.md) for detailed setup instructions
- **Smart Contracts**: See [bnb/README.md](bnb/README.md) for deployment instructions

---  

## Walkthrough

### Getting Started

1. Visit the homepage at [theseery.com](https://theseery.com)
2. Connect your MetaMask wallet (must be on BNB Smart Chain Testnet)
3. You'll be automatically redirected to the **Market** page after connecting

### Market Predictions

1. On the **Market** page, view real-time cryptocurrency prices in a table format
2. Each crypto shows:
   - Current price
   - AI-generated prediction (direction and percentage change)
   - Suggested action (Up/Down with percentage)
3. Click the **Refresh** button to generate new AI predictions for all cryptocurrencies
4. Click the **Stake** button on any crypto to stake on that prediction
5. In the stake modal:
   - Choose direction (Up or Down)
   - Enter stake amount (minimum 0.00001 BNB)
   - Confirm transaction in MetaMask
6. The prediction is automatically created on-chain if it doesn't exist, and your stake is recorded

### Staking Page

1. Navigate to the **Staking** page from the header
2. Browse all available stakeable predictions
3. Each prediction card shows:
   - Crypto name and current vs predicted price
   - Direction and percentage change
   - Total stakes for Up and Down pools
   - Time remaining until expiration
   - Your personal stake amounts (if you've staked)
4. Click on a prediction card to select it, then click **Stake** or **Stake More**
5. Choose direction and amount, then confirm in MetaMask
6. View **Claimable Rewards** section for expired predictions that have been resolved

### Viewing News

1. Navigate to the **News** page from the header
2. Browse trending crypto news articles
3. Click on any article to read the full story (opens in new tab)
4. Use the refresh button to get the latest news

### Viewing Profile

1. Navigate to the **Profile** page (requires wallet connection)
2. View your statistics:
   - **Win/Loss Record**: Wins, losses, and win rate percentage
   - **Financial Summary**: Total staked, total won, total lost, and net profit/loss
3. View detailed **My Stakes** table showing:
   - All your stakes with crypto, direction, amount
   - Predicted price and percentage change
   - Status (Won/Lost/Pending)
   - Creation date and resolution result

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

### Reward Distribution Scenarios

Seery uses a **proportional reward system** where winners receive their original stake back plus a proportional share of the losers' pool.

**Formula:**
```
Reward = Your Stake + (Your Stake / Total Winners' Stake) × Losers' Pool
```

#### Scenario 1: High Wins

**Stakes:**
- **High (Up):** 1 BNB (You) + 2 BNB (Person 2) + 5 BNB (Person 3) = **8 BNB total**
- **Low (Down):** 3 BNB total
- **Total Pool:** 11 BNB

**If High Wins - Reward Distribution:**

1. **You (1 BNB stake):**
   - Reward = 1 + (1 / 8) × 3 = **1.375 BNB**
   - Profit: **0.375 BNB** (37.5% return)

2. **Person 2 (2 BNB stake):**
   - Reward = 2 + (2 / 8) × 3 = **2.75 BNB**
   - Profit: **0.75 BNB** (37.5% return)

3. **Person 3 (5 BNB stake):**
   - Reward = 5 + (5 / 8) × 3 = **6.875 BNB**
   - Profit: **1.875 BNB** (37.5% return)

**Result:** All 11 BNB distributed. Winners get 37.5% return on their stake.

#### Scenario 2: Low Wins

**Stakes:**
- **High (Up):** 10 BNB total
- **Low (Down):** 1 BNB (You) + 2 BNB (Person 2) = **3 BNB total**
- **Total Pool:** 13 BNB

**If Low Wins - Reward Distribution:**

1. **You (1 BNB stake):**
   - Reward = 1 + (1 / 3) × 10 = **4.33 BNB**
   - Profit: **3.33 BNB** (333% return)

2. **Person 2 (2 BNB stake):**
   - Reward = 2 + (2 / 3) × 10 = **8.67 BNB**
   - Profit: **6.67 BNB** (333% return)

**Result:** All 13 BNB distributed. Winners get 333% return on their stake.

#### Key Points:

- **Proportional Distribution:** Larger stakes receive larger absolute rewards, but all winners get the same percentage return
- **Zero-Sum:** All funds in the pool are distributed (winners' stakes + losers' stakes)
- **Risk/Reward:** Smaller pools on the winning side result in higher returns for winners
- **Fair System:** Your reward is proportional to your stake size relative to other winners

### Smart Contracts

- **Stakes.sol**: Handles on-chain staking for crypto price predictions
- **main.sol**: Main contract for prediction management
- **Library.sol**: Shared library functions

**Deployed Contract Addresses:**

**BNB Smart Chain Mainnet:**
- `0x958dD10DfbF21e8F3c11BC8C005aa879144bBe0D`
- [View on BSCScan](https://bscscan.com/address/0x958dD10DfbF21e8F3c11BC8C005aa879144bBe0D)

**BNB Smart Chain Testnet:**
- `0xbB0383E1CE84C278a149AAb84F3aC7DE6687d2d6`
- [View on BSCScan Testnet](https://testnet.bscscan.com/address/0xbB0383E1CE84C278a149AAb84F3aC7DE6687d2d6)

## Team

The team behind Seery combines deep expertise in full-stack engineering, product design, and blockchain development.

**Don Sebial** - Product Designer  
A designer driven by clarity, curiosity, and a deep interest in human behavior. Don crafts experiences that feel natural, grounded in strategy, and shaped through disciplined creativity.  
[@don](https://www.linkedin.com/in/carl-john-don-sebial-882430187/)

**Peter Tibon** - Full-Stack Engineer  
A full-stack engineer with a decade of experience building scalable, high-performance applications across modern web stacks, from React and Next.js to Node, Python, and blockchain. Focused on clean architecture, testing discipline, and delivering reliable, intuitive solutions.  
[@peter](https://www.linkedin.com/in/petertibon/)

**Ken Dan Tinio** - Full-Stack Engineer & DevOps Specialist  
With nearly a decade of experience across web applications, IoT, AI, and blockchain, Ken builds and maintains end-to-end systems while managing deployments, server infrastructure, and CI/CD pipelines for reliable operations. He excels at integrating complex APIs, leading development efforts, and solving problems rapidly, including competing in multiple hackathons.  
[@kenn](https://www.linkedin.com/in/kdst/)
