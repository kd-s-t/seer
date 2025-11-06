# Testing Guide

## Hardhat Testing (Smart Contracts)

Hardhat is the **best tool** for testing Solidity contracts. Here's why and how to use it:

### Why Hardhat?

1. **Local Blockchain**: Runs a local Ethereum node in-memory
2. **Fast**: No network latency, tests run in milliseconds
3. **Free**: No gas costs for testing
4. **Isolated**: Each test gets a fresh blockchain state
5. **Powerful**: Built-in debugging, stack traces, and gas reporting

### Running Tests

```bash
# Compile contracts first
npm run compile

# Run all contract tests
npm run test:contracts

# Run specific test file
npx hardhat test test/PredictionMarket.test.js

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Run with verbose output
npx hardhat test --verbose
```

### Test Structure

Our tests use:
- **Mocha**: Test framework (included with Hardhat)
- **Chai**: Assertion library (`expect`, `should`, `assert`)
- **ethers.js**: Interact with contracts

### Example Test Flow

```javascript
describe("PredictionMarket", function () {
  beforeEach(async function () {
    // Deploy fresh contract for each test
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    predictionMarket = await PredictionMarket.deploy();
  });

  it("Should create a market", async function () {
    // Test market creation
    const tx = await predictionMarket.createMarket(...);
    await expect(tx).to.emit(predictionMarket, "MarketCreated");
  });
});
```

### Local Hardhat Node

For manual testing or frontend development:

```bash
# Start local node
npm run node

# This starts a local blockchain at http://127.0.0.1:8545
# With 20 test accounts pre-funded with 10000 ETH each
```

Then in another terminal:
```bash
# Deploy to local node
npx hardhat run scripts/deploy.js --network localhost
```

### Testing on BNB Testnet

For testing on actual BNB Chain testnet:

```bash
# Deploy to testnet
npm run deploy

# This uses the bnbTestnet network from hardhat.config.js
```

### Coverage Reports

See which parts of your contract are tested:

```bash
npm run test:coverage
```

This generates a coverage report showing:
- Which functions are tested
- Which lines are executed
- Branch coverage

### Common Test Patterns

#### Testing Events
```javascript
await expect(tx)
  .to.emit(contract, "EventName")
  .withArgs(arg1, arg2);
```

#### Testing Reverts
```javascript
await expect(
  contract.functionThatShouldFail()
).to.be.revertedWith("Error message");
```

#### Testing Balances
```javascript
const balanceBefore = await ethers.provider.getBalance(user.address);
await contract.functionThatPays();
const balanceAfter = await ethers.provider.getBalance(user.address);
expect(balanceAfter).to.be.gt(balanceBefore);
```

### Debugging Failed Tests

Hardhat provides excellent error messages:

```bash
# Run with stack traces
npx hardhat test --stack-traces

# Run specific test
npx hardhat test --grep "should create market"
```

### Gas Optimization Testing

```bash
# Report gas usage
REPORT_GAS=true npx hardhat test
```

This shows gas costs for each transaction, helping you optimize your contract.

## API Testing

For testing the Node.js API and database:

```bash
npm test
```

This runs tests in `tests/test.js` which cover:
- Database operations
- AI service
- API endpoints (if server is running)

## Integration Testing

Test the full stack:

1. Start Hardhat node: `npm run node`
2. Deploy contract: `npx hardhat run scripts/deploy.js --network localhost`
3. Update `.env` with local contract address
4. Start API server: `npm start`
5. Test frontend at `http://localhost:3015` and backend at `http://localhost:3016`

## Tips

- **Use beforeEach**: Reset state for each test
- **Test edge cases**: Invalid inputs, boundary conditions
- **Test security**: Access control, reentrancy, overflow
- **Test events**: Ensure events are emitted correctly
- **Test gas**: Optimize for cost efficiency
- **Use fixtures**: Reusable test data

## Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [ethers.js Documentation](https://docs.ethers.org/)
- [Chai Assertions](https://www.chaijs.com/api/bdd/)

