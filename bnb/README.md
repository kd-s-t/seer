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

Set in `.env`:
- `PRIVATE_KEY` - Deployer wallet private key
- `BNB_TESTNET_RPC` - BNB Chain testnet RPC URL
- `CONTRACT_ADDRESS` - Deployed contract address (after deployment)

## Networks

- Testnet: `npm run deploy` (uses bnbTestnet)
- Mainnet: `hardhat run scripts/deploy.js --network bnbMainnet`
- Local: `npx hardhat node` (starts local Hardhat network on port 8545)

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

See main README.md for full documentation.

