# Deploy Prediction Contracts

## Prerequisites

1. Make sure you have a `.env` file in the `bnb/` directory with:
   ```env
   PRIVATE_KEY=your-private-key-here
   BNB_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
   ```

2. Make sure your wallet has testnet BNB for gas fees.

## Deployment Steps

1. **Compile contracts:**
   ```bash
   cd bnb
   npm run compile
   ```

2. **Deploy contracts:**
   ```bash
   npm run deploy:predictions
   ```

   Or manually:
   ```bash
   npx hardhat run scripts/deployPredictions.js --network bnbTestnet
   ```

3. **Copy the deployed address to your `expressjs/.env` file:**
   ```env
   PREDICTION_STAKING_ADDRESS=0x...  # From deployment output
   PRIVATE_KEY=your-private-key      # Same key used for deployment
   ```

4. **Restart your backend server** to load the new environment variables.

## What Gets Deployed

1. **PredictionStaking** - Consolidated contract that handles both prediction tracking and staking

## After Deployment

1. Go to Market page
2. Click Refresh button
3. Predictions will be recorded on-chain
4. Stake buttons will appear in the Actions column
5. Click Stake button to go to staking page

