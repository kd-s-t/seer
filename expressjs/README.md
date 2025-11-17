# Express.js Backend

Node.js API server for Seery prediction market platform.

## Installation

**1. Install dependencies:**
```bash
npm install
```

**2. Set up environment variables:**

Create a `.env` file in the `expressjs/` folder by copying `.env.example`:

```bash
cp .env.example .env
```

Then edit `.env` and fill in the required values:
- `OPENAI_API_KEY` - Your OpenAI API key (required for AI features)
- `BLOCKCHAIN_CONTRACT_ADDRESS` - Contract address (see deployed addresses below)
- `BLOCKCHAIN_NETWORK` - Set to `testnet` or `mainnet`

**Deployed Contract Addresses:**
- **Mainnet:** `0x958dD10DfbF21e8F3c11BC8C005aa879144bBe0D` ([BSCScan](https://bscscan.com/address/0x958dD10DfbF21e8F3c11BC8C005aa879144bBe0D))
- **Testnet:** `0xbB0383E1CE84C278a149AAb84F3aC7DE6687d2d6` ([BSCScan Testnet](https://testnet.bscscan.com/address/0xbB0383E1CE84C278a149AAb84F3aC7DE6687d2d6))

**Note:** The live deployment at [theseery.com](https://theseery.com) uses BNB Smart Chain Testnet.

**3. Deploy Smart Contract:**

Before starting the backend, deploy the smart contract:
```bash
cd ../bnb
npm run compile
npm run deploy
```

Copy the deployed contract address to your `.env` file.

## Running

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server runs on `http://localhost:3016`

## Environment Variables

Required variables:
- `OPENAI_API_KEY` - Required for AI features (market generation and resolution)
- Contract address (one of these, checked in order):
  - `BLOCKCHAIN_CONTRACT_ADDRESS` - Primary (recommended)
  - `MAIN_CONTRACT_ADDRESS` - Alternative
  - `PREDICTION_STAKING_ADDRESS` - Alternative
  - `CONTRACT_ADDRESS` - Fallback for compatibility
- Network (one of these):
  - `BLOCKCHAIN_NETWORK` - Primary (recommended): `testnet` or `mainnet`
  - `NETWORK` - Fallback: `testnet` or `mainnet`
- `PORT` - Server port (default: 3016)

Optional variables:
- `BNB_TESTNET_RPC` - BNB Chain testnet RPC URL
- `BNB_MAINNET_RPC` - BNB Chain mainnet RPC URL
- `BLOCKCHAIN_RPC` - RPC URL for localhost/local network
- `PREDICTION_TRACKER_ADDRESS` - PredictionTracker contract address (for on-chain prediction tracking)
- `PRIVATE_KEY` or `BLOCKCHAIN_PRIVATE_KEY` - For automated transactions (required for on-chain prediction recording)
- `OPENAI_MODEL` - OpenAI model to use (default: gpt-3.5-turbo)

## Backend API

- **Express.js** server with RESTful API endpoints
- **OpenAI** integration for price predictions (paid)
- **BNB Chain** integration using ethers.js
- **Oracle Integration**: Chainlink and Pyth Network for price verification
- **Auto-Resolution**: Automated cron job for resolving expired stakes
- **CoinGecko** API for real-time crypto prices
- **TheNewsAPI** for crypto news aggregation (paid)

## API Endpoints

### Markets
- `GET /api/markets` - List all markets
- `GET /api/markets/:id` - Get market details
- `POST /api/markets` - Create new market
- `POST /api/markets/:id/bet` - Place a bet
- `POST /api/markets/:id/resolve` - Resolve a market
- `GET /api/markets/:id/bets` - Get all bets for a market

### AI Features
- `POST /api/ai/generate-markets` - Generate markets from news
- `POST /api/ai/analyze-news` - Analyze news and suggest markets
- `GET /api/markets/:id/ai-resolution` - Get AI resolution suggestion

### User Data
- `GET /api/users/:address/bets` - Get user's betting history

### Config
- `GET /api/config` - Get frontend configuration (contract address, network)

## Testing

```bash
npm test
```

## Project Structure

```
expressjs/
├── server.js         # Express API server
├── ai-service.js     # OpenAI integration
├── prompts.js        # AI prompt templates
├── lib/              # Library modules
│   ├── binance/      # BNB Chain & Binance integration
│   │   ├── provider.js           # Blockchain provider setup
│   │   ├── contract.js           # PredictionMarket contract
│   │   ├── predictionTracker.js # PredictionTracker contract
│   │   ├── predictionStaking.js # PredictionStaking contract
│   │   ├── utils.js              # Utility functions
│   │   └── index.js              # BNB Chain utilities
│   ├── coingecko/    # CoinGecko API
│   ├── openai/       # OpenAI integration
│   └── news/         # News fetching
├── tests/            # Test suite
└── docs/             # Documentation
```

See main [README.md](../README.md) for full project documentation.

