# Fix RPC Connection Issue

If you're getting SSL errors, try these RPC endpoints in your `bnb/.env` file:

**Option 1 (Recommended):**
```env
BNB_TESTNET_RPC=https://data-seed-prebsc-2-s1.binance.org:8545
```

**Option 2:**
```env
BNB_TESTNET_RPC=https://bsc-testnet-rpc.publicnode.com
```

**Option 3:**
```env
BNB_TESTNET_RPC=https://bsc-testnet.blockpi.network/v1/rpc/public
```

**Option 4:**
```env
BNB_TESTNET_RPC=https://endpoints.omniatech.io/v1/bsc/testnet/public
```

Make sure your `.env` file in `bnb/` has:
```env
PRIVATE_KEY=your-private-key-here
BNB_TESTNET_RPC=one-of-the-urls-above
```

Then run:
```bash
npm run deploy:predictions
```

