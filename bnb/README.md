# BNB Chain Smart Contracts

Solidity smart contracts for Seery prediction market platform.

## Quick Start

**1. Install dependencies:**
```bash
npm install
```

**2. Compile:**
```bash
npm run compile
```

**3. Deploy:**
```bash
npm run deploy
```

**4. Test:**
```bash
npm test
```

## Environment Variables

Set in `.env` (see `.env.example` for template):
- `PRIVATE_KEY` - Deployer wallet private key
- `BNB_TESTNET_RPC` - BNB Chain testnet RPC URL (default: https://data-seed-prebsc-1-s1.binance.org:8545)
- `BNB_MAINNET_RPC` - BNB Chain mainnet RPC URL (default: https://bsc-dataseed.binance.org/)
- `CONTRACT_ADDRESS` - Deployed contract address (after deployment)

## Networks

- **Testnet:** `npm run deploy` (uses bnbTestnet)
  - Contract: `0xbB0383E1CE84C278a149AAb84F3aC7DE6687d2d6` ([BSCScan Testnet](https://testnet.bscscan.com/address/0xbB0383E1CE84C278a149AAb84F3aC7DE6687d2d6))
- **Mainnet:** `npx hardhat run scripts/deployPredictions.js --network bnbMainnet`
  - Contract: `0x958dD10DfbF21e8F3c11BC8C005aa879144bBe0D` ([BSCScan](https://bscscan.com/address/0x958dD10DfbF21e8F3c11BC8C005aa879144bBe0D))
- **Local:** `npx hardhat node` (starts local Hardhat network on port 8545)

## Funding Wallets on Local Network

To fund a wallet with ETH/BNB on the local Hardhat network for testing:

**1. Start the Hardhat node:**
```bash
npx hardhat node
```

**2. Fund a wallet:**
```bash
npx hardhat run scripts/fund-wallet.js --network localhost
```

This script (`bnb/scripts/fund-wallet.js`) sends 100 ETH from the first Hardhat account to the wallet address `0x4d3ebc244b5d875f8b284e54e76acbb7eaf1afae`. 

To fund a different address, edit the `recipientAddress` variable in `scripts/fund-wallet.js`.

**Note:** The Hardhat node provides 20 accounts with 10,000 ETH each by default. You can use any of these accounts or fund your own wallet address.

## On-Chain Storage

All staking data is stored on BNB Chain:
- User stakes (amount, direction, prediction ID)
- Prediction data (crypto ID, current price, predicted price, expiration)
- Staker information (wallet address, stake amounts, timestamps)
- Resolution status and rewards
