const { ethers } = require('ethers');
const { getProvider, getWallet } = require('./provider');

const PREDICTION_STAKING_ADDRESS = process.env.PREDICTION_STAKING_ADDRESS;

const PREDICTION_STAKING_ABI = [
  // core methods
  "function stakeOnPrediction(uint256 predictionId, bool stakeUp) payable",
  "function getUserStakedPredictions(address user) view returns (uint256[])",
  "function claimRewards(uint256 predictionId)",

  "function recordPrediction(string memory cryptoId, uint256 currentPrice, uint256 predictedPrice, string memory direction, uint256 percentChange) returns (uint256)",
  "function verifyPrediction(uint256 predictionId, uint256 actualPrice)",

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

module.exports = {
  getPredictionStaking,
  getUserStakedPredictions,
  claimRewards
};

