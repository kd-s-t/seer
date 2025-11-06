# Tech Stack Overview

## 🎯 Full Stack Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│  HTML5 + CSS3 + Vanilla JavaScript + MetaMask          │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTP/REST API
┌─────────────────────────────────────────────────────────┐
│                    Backend Layer                         │
│  Node.js + Express.js + SQLite                          │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│              AI & Blockchain Layer                       │
│  OpenAI API + BNB Chain (Solidity + ethers.js)        │
└─────────────────────────────────────────────────────────┘
```

## 📦 Core Technologies

### **Backend**
- **Node.js** (v16+) - JavaScript runtime
- **Express.js** (v4.18.2) - Web framework for REST API
- **dotenv** (v16.3.1) - Environment variable management
- **CORS** (v2.8.5) - Cross-origin resource sharing
- **axios** (v1.6.2) - HTTP client for external APIs

### **Database**
- **SQLite** - Embedded database
- **better-sqlite3** (v9.2.2) - Fast, synchronous SQLite driver
- **sqlite3** (v5.1.6) - SQLite bindings

### **Blockchain**
- **Solidity** (v0.8.20) - Smart contract language
- **Hardhat** (v2.19.4) - Development environment & testing
- **ethers.js** (v6.9.0) - Ethereum library for BNB Chain
- **@nomicfoundation/hardhat-toolbox** (v4.0.0) - Hardhat plugins
- **BNB Chain** - Target blockchain (BSC)

### **AI/ML**
- **OpenAI API** (v4.20.0) - GPT models for:
  - Market generation from news
  - AI-assisted market resolution
  - News analysis and sentiment

### **Frontend**
- **HTML5** - Markup
- **CSS3** - Styling (with gradients, flexbox, grid)
- **Vanilla JavaScript** - No framework dependencies
- **MetaMask** - Web3 wallet integration

### **Testing**
- **Hardhat Test** - Contract testing framework
- **Chai** (v4.3.10) - Assertion library
- **Mocha** - Test runner (included with Hardhat)

### **Development Tools**
- **nodemon** (v3.0.2) - Auto-reload for development
- **Git** - Version control

## 🏗️ Architecture Layers

### 1. **Smart Contract Layer** (On-Chain)
```
contracts/PredictionMarket.sol
├── Market creation
├── Bet placement
├── Market resolution
├── Winner payouts
└── Platform fee collection (2%)
```

**Deployment:**
- Hardhat for compilation & deployment
- Deployable to BNB Chain (Testnet/Mainnet)

### 2. **API Layer** (Backend)
```
server.js
├── REST API endpoints
├── Market management
├── Betting operations
├── AI integration
└── Database operations
```

**Endpoints:**
- `/api/markets` - Market CRUD
- `/api/markets/:id/bet` - Place bets
- `/api/markets/:id/resolve` - Resolve markets
- `/api/ai/*` - AI-powered features

### 3. **Database Layer** (Off-Chain)
```
database.js (SQLite)
├── markets table
├── bets table
└── ai_resolutions table
```

**Features:**
- Fast, embedded database
- No external dependencies
- Perfect for MVP/prototype

### 4. **AI Service Layer**
```
ai-service.js
├── generateMarketsFromNews()
├── suggestMarketResolution()
└── analyzeNewsForMarkets()
```

**Models:**
- GPT-3.5-turbo (default, cost-effective)
- GPT-4-turbo (optional, higher quality)

### 5. **Blockchain Integration Layer**
```
blockchain.js
├── Contract interaction
├── Transaction handling
├── Event listening
└── BNB Chain RPC connection
```

**Networks:**
- BNB Testnet (Chain ID: 97)
- BNB Mainnet (Chain ID: 56)
- Hardhat Local (for testing)

### 6. **Frontend Layer**
```
public/index.html
├── Market browsing
├── Market creation
├── Betting interface
├── Wallet connection
└── Real-time updates
```

**Features:**
- Responsive design
- MetaMask integration
- Real-time market data
- AI market generation UI

## 🔄 Data Flow

### Market Creation Flow
```
User → Frontend → API → Database
                    ↓
                 Blockchain (optional)
                    ↓
                 AI Service (optional)
```

### Betting Flow
```
User → Frontend → MetaMask → BNB Chain
                    ↓
                 API → Database
```

### Resolution Flow
```
Creator/AI → API → AI Service → Database
                    ↓
                 Blockchain → Payouts
```

## 🛠️ Development Workflow

### Local Development
```bash
# Backend
npm run dev          # Auto-reload server

# Contracts
npm run compile      # Compile Solidity
npm run test:contracts  # Test contracts
npm run node         # Local blockchain

# Full Stack
npm start            # Production server
```

### Testing
```bash
npm test             # API/Integration tests
npm run test:contracts  # Smart contract tests
npm run test:coverage   # Coverage report
```

### Deployment
```bash
npm run compile      # Compile contracts
npm run deploy       # Deploy to BNB Chain
```

## 📊 Technology Choices - Why?

| Technology | Why We Chose It |
|------------|----------------|
| **Node.js** | JavaScript everywhere, fast development |
| **Express.js** | Lightweight, flexible, widely used |
| **SQLite** | No setup needed, perfect for MVP |
| **Solidity** | Standard for BNB Chain/EVM chains |
| **Hardhat** | Best tooling, great testing, fast |
| **ethers.js** | Modern, well-maintained, v6 API |
| **OpenAI** | Best AI models, easy integration |
| **Vanilla JS** | No build step, fast loading, simple |

## 🔐 Security Considerations

- **Smart Contracts**: Solidity 0.8.20 (overflow protection)
- **Input Validation**: Both on-chain and off-chain
- **Access Control**: Creator-only resolution
- **Platform Fees**: Transparent 2% fee
- **Environment Variables**: Sensitive data in `.env`

## 📈 Scalability Path

**Current (MVP):**
- SQLite for data
- Single server
- Direct OpenAI calls

**Future Scaling:**
- PostgreSQL/MySQL for production
- Redis for caching
- Queue system for AI requests
- CDN for frontend
- Load balancer for API

## 🌐 Network Configuration

**BNB Chain:**
- Testnet RPC: `https://data-seed-prebsc-1-s1.binance.org:8545`
- Mainnet RPC: `https://bsc-dataseed.binance.org/`
- Chain IDs: 97 (testnet), 56 (mainnet)

**Local Testing:**
- Hardhat node: `http://127.0.0.1:8545`
- Pre-funded test accounts

## 📦 Package Summary

**Production Dependencies:** 8 packages
**Development Dependencies:** 4 packages
**Total:** 12 packages (lightweight!)

## 🎯 Hackathon Alignment

✅ **BNB Chain** - Required blockchain  
✅ **AI Integration** - OpenAI for market generation  
✅ **Database** - SQLite for data persistence  
✅ **User Interaction** - Web interface  
✅ **Blockchain Integration** - Full on-chain functionality  
✅ **Revenue Model** - Platform fees implemented  

---

**Last Updated:** Based on current `package.json` and project structure

