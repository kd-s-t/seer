const { ethers } = require('ethers');
const { getProvider, getWallet } = require('./provider');

const PREDICTION_STAKING_ADDRESS = process.env.PREDICTION_STAKING_ADDRESS;

const PREDICTION_STAKING_ABI = [
  "function stakeOnPrediction(uint256 predictionId, bool stakeUp) payable",
  "function getUserStakedPredictions(address user) view returns (uint256[])",
  "function claimRewards(uint256 predictionId)",
  "function recordPrediction(string memory cryptoId, uint256 currentPrice, uint256 predictedPrice, string memory direction, uint256 percentChange) returns (uint256)",
  "function verifyPrediction(uint256 predictionId, uint256 actualPrice)",
  "function getPrediction(uint256 predictionId) view returns (address predictor, string memory cryptoId, uint256 currentPrice, uint256 predictedPrice, uint256 actualPrice, uint256 timestamp, bool verified, uint256 accuracy, string memory direction, uint256 percentChange)",
  "function getPredictionExpiry(uint256 predictionId) view returns (uint256)",
  "event StakePlaced(uint256 indexed predictionId, address indexed staker, uint256 amount, bool stakeUp, uint256 timestamp)",
  "event RewardsDistributed(uint256 indexed predictionId, uint256 totalRewards, uint256 stakerCount)",
  "event PredictionRecorded(uint256 indexed predictionId, address indexed predictor, string cryptoId, uint256 currentPrice, uint256 predictedPrice, uint256 timestamp)",
  "event PredictionVerified(uint256 indexed predictionId, uint256 actualPrice, uint256 accuracy)"
];

let predictionStaking;

function getPredictionStaking() {
  if (!predictionStaking && PREDICTION_STAKING_ADDRESS) {
    const provider = getProvider();
    const wallet = getWallet();
    predictionStaking = wallet
      ? new ethers.Contract(PREDICTION_STAKING_ADDRESS, PREDICTION_STAKING_ABI, wallet)
      : new ethers.Contract(PREDICTION_STAKING_ADDRESS, PREDICTION_STAKING_ABI, provider);
  }
  return predictionStaking;
}


async function getUserStakedPredictions(userAddress) {
  const staking = getPredictionStaking();
  if (!staking) {
    return [];
  }
  
  return await staking.getUserStakedPredictions(userAddress);
}

async function claimRewards(predictionId) {
  const staking = getPredictionStaking();
  const wallet = getWallet();
  
  if (!staking || !wallet) {
    return null;
  }
  
  const tx = await staking.claimRewards(predictionId);
  await tx.wait();
  return tx.hash;
}

async function getPrediction(predictionId) {
  const staking = getPredictionStaking();
  if (!staking) {
    return null;
  }
  return await staking.getPrediction(predictionId);
}

async function getPredictionExpiry(predictionId) {
  const staking = getPredictionStaking();
  if (!staking) {
    return null;
  }
  return await staking.getPredictionExpiry(predictionId);
}

async function getUserStakesWithData(userAddress) {
  const staking = getPredictionStaking();
  if (!staking) {
    return [];
  }
  
  const predictionIds = await staking.getUserStakedPredictions(userAddress);
  
  const stakesData = await Promise.all(
    predictionIds.map(async (id) => {
      const predictionId = id.toString();
      const [prediction, expiresAt] = await Promise.all([
        getPrediction(predictionId),
        getPredictionExpiry(predictionId)
      ]);
      
      if (!prediction) {
        return null;
      }
      
      return {
        predictionId,
        cryptoId: prediction.cryptoId,
        currentPrice: prediction.currentPrice.toString(),
        predictedPrice: prediction.predictedPrice.toString(),
        actualPrice: prediction.actualPrice.toString(),
        timestamp: prediction.timestamp.toString(),
        verified: prediction.verified,
        accuracy: prediction.accuracy.toString(),
        direction: prediction.direction,
        percentChange: prediction.percentChange.toString(),
        expiresAt: expiresAt ? expiresAt.toString() : '0',
        totalStakedUp: '0',
        totalStakedDown: '0',
        userStakeUp: '0',
        userStakeDown: '0'
      };
    })
  );
  
  return stakesData.filter(Boolean);
}

module.exports = {
  getPredictionStaking,
  getUserStakedPredictions,
  claimRewards,
  getPrediction,
  getPredictionExpiry,
  getUserStakesWithData
};

