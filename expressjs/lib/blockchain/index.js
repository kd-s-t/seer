const { ethers } = require('ethers');
require('dotenv').config();

// BNB Chain configuration
const BNB_TESTNET_RPC = process.env.BNB_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545';
const BNB_MAINNET_RPC = process.env.BNB_MAINNET_RPC || 'https://bsc-dataseed.binance.org/';
const PREDICTION_STAKING_ADDRESS = process.env.PREDICTION_STAKING_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// ABI for PredictionStaking contract (consolidated with PredictionTracker)
const PREDICTION_STAKING_ABI = [
  "function stakeOnPrediction(uint256 predictionId, bool stakeUp) payable",
  "function claimRewards(uint256 predictionId)",
  "function getUserStakedPredictions(address user) view returns (uint256[])",
  "function recordPrediction(string memory cryptoId, uint256 currentPrice, uint256 predictedPrice, string memory direction, uint256 percentChange) returns (uint256)",
  "function verifyPrediction(uint256 predictionId, uint256 actualPrice)",
  "event StakePlaced(uint256 indexed predictionId, address indexed staker, uint256 amount, bool stakeUp, uint256 timestamp)",
  "event RewardsDistributed(uint256 indexed predictionId, uint256 totalRewards, uint256 stakerCount)",
  "event PredictionRecorded(uint256 indexed predictionId, address indexed predictor, string cryptoId, uint256 currentPrice, uint256 predictedPrice, uint256 timestamp)",
  "event PredictionVerified(uint256 indexed predictionId, uint256 actualPrice, uint256 accuracy)"
];

let provider;
let predictionStaking;
let wallet;

/**
 * Initialize blockchain connection
 */
function initBlockchain(network = 'testnet') {
  try {
    const rpcUrl = network === 'mainnet' ? BNB_MAINNET_RPC : BNB_TESTNET_RPC;
    provider = new ethers.JsonRpcProvider(rpcUrl);
    
    if (PREDICTION_STAKING_ADDRESS) {
      predictionStaking = new ethers.Contract(PREDICTION_STAKING_ADDRESS, PREDICTION_STAKING_ABI, provider);
    }
    
    if (PRIVATE_KEY) {
      wallet = new ethers.Wallet(PRIVATE_KEY, provider);
      if (PREDICTION_STAKING_ADDRESS) {
        predictionStaking = new ethers.Contract(PREDICTION_STAKING_ADDRESS, PREDICTION_STAKING_ABI, wallet);
      }
    }
    
    return { provider, predictionStaking, wallet };
  } catch (error) {
    console.error('Error initializing blockchain:', error);
    throw error;
  }
}

/**
 * Get provider (read-only)
 */
function getProvider() {
  if (!provider) {
    initBlockchain();
  }
  return provider;
}

/**
 * Format BNB amount
 */
function formatBNB(amount) {
  return ethers.formatEther(amount);
}

/**
 * Parse BNB amount
 */
function parseBNB(amount) {
  return ethers.parseEther(amount.toString());
}

/**
 * Record a prediction on-chain
 */
async function recordPredictionOnChain(cryptoId, currentPrice, predictedPrice, direction, percentChange) {
  try {
    const staking = getPredictionStaking();
    if (!staking || !wallet) {
      return null;
    }
    
    const currentPriceWei = ethers.parseUnits(currentPrice.toString(), 18);
    const predictedPriceWei = ethers.parseUnits(predictedPrice.toString(), 18);
    const percentChangeScaled = Math.round(percentChange * 100);
    
    const tx = await staking.recordPrediction(
      cryptoId,
      currentPriceWei,
      predictedPriceWei,
      direction,
      percentChangeScaled
    );
    const receipt = await tx.wait();
    
    const event = receipt.logs.find(log => {
      try {
        const parsed = staking.interface.parseLog(log);
        return parsed && parsed.name === 'PredictionRecorded';
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsed = staking.interface.parseLog(event);
      return {
        predictionId: parsed.args.predictionId.toString(),
        txHash: receipt.hash
      };
    }
    
    return { txHash: receipt.hash };
  } catch (error) {
    console.error('Error recording prediction on-chain:', error);
    return null;
  }
}

/**
 * Verify a prediction on-chain
 */
async function verifyPredictionOnChain(predictionId, actualPrice) {
  try {
    const staking = getPredictionStaking();
    if (!staking || !wallet) {
      throw new Error('PredictionStaking not initialized');
    }
    
    const actualPriceWei = ethers.parseUnits(actualPrice.toString(), 18);
    const tx = await staking.verifyPrediction(predictionId, actualPriceWei);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error('Error verifying prediction on-chain:', error);
    throw error;
  }
}

/**
 * Get PredictionStaking contract instance
 */
function getPredictionStaking() {
  if (!predictionStaking && PREDICTION_STAKING_ADDRESS) {
    initBlockchain();
  }
  return predictionStaking;
}

/**
 * Get stakeable predictions (not expired)
 */

module.exports = {
  initBlockchain,
  getProvider,
  getPredictionStaking,
  recordPredictionOnChain,
  verifyPredictionOnChain,
  formatBNB,
  parseBNB
};

