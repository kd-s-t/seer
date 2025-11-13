<div align="center"> 
	<a href="https://dorahacks.io" target="_blank">
		<img src="./seedify.png" width="100%" /> 
	</a>
</div>

<div align="center"> 
	<img src="./seerylogov3.png" width="200px" alt="Seery Logo" />
</div>

**Seery** is a decentralized prediction platform on BNB Chain that uses AI to create markets from news and resolve them faster than traditional oracles. Unlike UMA's 24-48h optimistic oracle, our AI-assisted resolution provides near-instant results while maintaining accuracy through evidence-based analysis. The platform automatically generates tradeable markets from current events, allows users to bet on outcomes, and uses AI to suggest resolutions based on verifiable facts. All bets and payouts are settled on-chain with a 2% platform fee. The modern web interface makes prediction markets accessible to non-technical users, addressing the UX gap in current DeFi prediction markets. Revenue is generated through platform fees, creating a sustainable business model.

**Features:**
- **BNB Chain**: Mainnet and testnet support for all transactions
- **AI-Powered Resolution**: Resolves markets in minutes instead of days using OpenAI
- **On-Chain Prediction Tracking**: AI price predictions are automatically recorded on-chain for accuracy tracking and verification
- **Real-Time Updates**: Live market data and pool sizes
- **Fully On-Chain**: All market data stored on blockchain (no database)

Use cases for Seery include event prediction markets, news-based trading, sports betting, political predictions, crypto price predictions, and any scenario requiring fast, AI-assisted market resolution with on-chain settlement.

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
│   ├── components/       # React components
│   ├── public/           # Static assets
│   └── package.json
├── expressjs/
│   ├── server.js         # Express API server
│   ├── ai-service.js    # OpenAI integration
│   ├── blockchain.js    # BNB Chain integration
│   ├── docs/            # Documentation
│   └── package.json
└── bnb/
    ├── contracts/       # Solidity contracts
    ├── scripts/         # Deployment scripts
    ├── test/           # Contract tests
    └── package.json
```

This project addresses several YZi Labs Preferred Project opportunities:

1. **AI-Assisted Oracles**: Faster resolution than UMA's 24-48h optimistic oracle
2. **Subjective Predictions**: AI can resolve subjective or multi-stage predictions
3. **Better UX**: Modern web interface makes prediction markets feel like normal apps
4. **Revenue Focus**: Platform fees create sustainable business model

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

### Creating Markets

1. **Manual Creation:**
   - Connect your MetaMask wallet
   - Enter a question (e.g., "Will Bitcoin reach $100k by end of 2024?")
   - Add outcomes (comma-separated, e.g., "Yes, No")
   - Set duration (1-168 hours)
   - Click "Create Market"

2. **AI-Generated Markets:**
   - Click "🤖 Generate with AI" button
   - AI will suggest markets based on current news
   - Review and create the suggested market

### Placing Bets

1. Browse active markets
2. Select an outcome
3. Enter bet amount (minimum 0.001 BNB)
4. Click "Bet"
5. Confirm transaction in MetaMask

### Resolving Markets

Markets can be resolved:
- **Manually**: By the market creator after the end time
- **AI-Assisted**: Use AI to suggest the winning outcome
- **Automatically**: After end time (if configured)

## Revenue Model

- **Platform Fee**: 2% of all winning bet payouts
- **Market Creation**: Free (can add fees in future)
- **AI Features**: Powered by OpenAI API (costs covered by platform fees)

---  

## Submission Requirements

### ✅ Completed

- [x] **Public Code Repo**: All code is in this repository
- [x] **Working Prototype**: 
  - [x] User interaction (React web interface with wallet connection)
  - [x] AI integration (market generation and resolution)
  - [x] Blockchain integration (BNB Chain smart contracts - fully on-chain)
- [x] **Tests**: Basic test suite included
- [x] **BNB Chain**: All contracts deployable to BNB Chain

## On-Chain Prediction Accuracy Tracking

Every time the market-prediction API is called (when refresh is pressed in the frontend), AI price predictions are automatically recorded on-chain using the `PredictionTracker` smart contract. This creates an immutable record of:

- Current price at prediction time
- Predicted price (based on direction and percent change)
- Prediction timestamp
- Direction (up/down) and percent change
- Crypto asset ID

Predictions can be verified later using Chainlink price feeds to calculate accuracy and build trust in AI performance. See [BNB_CHAIN_UTILIZATION.md](confluence/BNB_CHAIN_UTILIZATION.md) for more details.

**Setup:**
1. Deploy the `PredictionTracker` contract (see `bnb/contracts/PredictionTracker.sol`)
2. Set `PREDICTION_TRACKER_ADDRESS` in your `.env` file
3. Set `PRIVATE_KEY` for automated on-chain recording

## Future Enhancements

- [ ] Account abstraction for gasless transactions
- [ ] Mobile app
- [ ] Advanced AI models for better predictions
- [ ] Liquidity pools for market making
- [ ] Social features (following traders, market discussions)
- [ ] Multi-chain support
- [ ] NFT rewards for top traders
- [ ] Automatic prediction verification using Chainlink oracles

**Built for Seedify Predictions Market Hackathon**

## Team

- [@kenn](https://www.linkedin.com/in/kdst/)
- [@don](https://www.linkedin.com/in/carl-john-don-sebial-882430187/)
- [@peter](https://www.linkedin.com/in/petertibon/)
