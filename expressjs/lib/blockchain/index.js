const { ethers } = require('ethers');
require('dotenv').config();

// BNB Chain configuration - use BLOCKCHAIN_RPC for all networks
const RPC = process.env.BLOCKCHAIN_RPC;
const NETWORK = process.env.BLOCKCHAIN_NETWORK || process.env.NETWORK;
// Main contract address (combines Library + Stakes functionality)
const MAIN_CONTRACT_ADDRESS = process.env.BLOCKCHAIN_CONTRACT_ADDRESS || process.env.MAIN_CONTRACT_ADDRESS || process.env.PREDICTION_STAKING_ADDRESS || process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || process.env.PRIVATE_KEY;

// Combined ABI for Main contract (includes both library and staking functions)
const MAIN_ABI = [
  // Staking functions
  "function createStake(string memory cryptoId, uint256 currentPrice, uint256 predictedPrice, string memory direction, uint256 percentChange, bool stakeUp, uint256 libraryId) payable returns (uint256)",
  "function getStakes() view returns (tuple(tuple(address createdBy, uint256 createdAt, uint256 expiresAt, uint256 libraryId, bool rewarded, bool predictionCorrect, bool stakeUp, string cryptoId, uint256 currentPrice, uint256 predictedPrice, uint256 actualPrice, string direction, uint256 percentChange)[] stakes, uint256 totalStakes, uint256 totalAmountStaked))",
  "function getStake(uint256 stakeId) view returns (address, address, uint256, uint256, bool, bool, string memory, uint256, uint256, string memory, uint256)",
  "function getStakesByCreator(address creator) view returns (tuple(address createdBy, address staker, uint256 amount, uint256 timestamp, bool rewarded, bool stakeUp, string cryptoId, uint256 currentPrice, uint256 predictedPrice, string direction, uint256 percentChange)[])",
  "function getStakesByStaker(address staker) view returns (tuple(address createdBy, address staker, uint256 amount, uint256 timestamp, bool rewarded, bool stakeUp, string cryptoId, uint256 currentPrice, uint256 predictedPrice, string direction, uint256 percentChange)[])",
  "function getStakersByStake(uint256 stakeId) view returns (tuple(uint256 id, address wallet, uint256 stakeId, uint256 amountInBNB, uint256 createdAt, bool stakeUp, bool rewarded)[])",
  "function getUserStats(address user) view returns (uint256 wins, uint256 losses, uint256 totalStaked, uint256 totalWon, uint256 totalLost, uint256 winRate)",
  "function getCorrectPredictionsByCrypto(string memory cryptoId) view returns (tuple(address createdBy, uint256 createdAt, uint256 expiresAt, uint256 libraryId, bool rewarded, bool predictionCorrect, bool stakeUp, string cryptoId, uint256 currentPrice, uint256 predictedPrice, uint256 actualPrice, string direction, uint256 percentChange)[])",
  "function stakeCount() view returns (uint256)",
  // Library functions
  "function createLibrary(string memory dataType, string[] memory tags, tuple(string id, string title, string summary, string content, string url, string image, string date, string metadata)[] memory items, string memory source) returns (uint256)",
  "function getAllLibraries() view returns (uint256[] memory libraryIds, string[] memory dataTypes, uint256[] memory timestamps, string[] memory sources)",
  "function getLibrary(uint256 libraryId) view returns (string memory, string[] memory, uint256, string memory, tuple(string id, string title, string summary, string content, string url, string image, string date, string metadata)[])",
  // Events
  "event StakePlaced(uint256 indexed stakeId, address indexed createdBy, address indexed staker, uint256 amount, bool stakeUp, uint256 timestamp)",
  "event LibraryCreated(uint256 indexed libraryId, string dataType, uint256 timestamp, string source)"
];

let provider;
let mainContract;
let wallet;

/**
 * Initialize blockchain connection
 */
function initBlockchain(network = NETWORK) {
  try {
    if (!RPC) {
      throw new Error('No RPC URL configured. Set BLOCKCHAIN_RPC in environment variables');
    }
    
    provider = new ethers.JsonRpcProvider(RPC);
    
    if (MAIN_CONTRACT_ADDRESS) {
      mainContract = new ethers.Contract(MAIN_CONTRACT_ADDRESS, MAIN_ABI, provider);
    }
    
    if (PRIVATE_KEY) {
      wallet = new ethers.Wallet(PRIVATE_KEY, provider);
      if (MAIN_CONTRACT_ADDRESS) {
        mainContract = new ethers.Contract(MAIN_CONTRACT_ADDRESS, MAIN_ABI, wallet);
      }
    }
    
    return { provider, mainContract, wallet };
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
    const contract = getMainContract();
    if (!contract || !wallet) {
      return null;
    }
    
    const currentPriceWei = ethers.parseUnits(currentPrice.toString(), 18);
    const predictedPriceWei = ethers.parseUnits(predictedPrice.toString(), 18);
    const percentChangeScaled = Math.round(percentChange * 100);
    
    const tx = await contract.recordPrediction(
      cryptoId,
      currentPriceWei,
      predictedPriceWei,
      direction,
      percentChangeScaled
    );
    const receipt = await tx.wait();
    
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'PredictionRecorded';
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsed = contract.interface.parseLog(event);
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
function getMainContract() {
  if (!mainContract && MAIN_CONTRACT_ADDRESS) {
    initBlockchain();
  }
  return mainContract;
}

// Backward compatibility aliases
function getPredictionStaking() {
  return getMainContract();
}

function getLibraryStorage() {
  return getMainContract();
}

/**
 * Create library entry on-chain
 */
async function createLibraryOnChain(dataType, tags, items, source = 'newspai') {
  try {
    const contract = getMainContract();
    if (!contract || !wallet) {
      return null;
    }
    
    const provider = getProvider();
    const pendingCount = await provider.getTransactionCount(wallet.address, 'pending');
    const latestCount = await provider.getTransactionCount(wallet.address, 'latest');
    
    if (pendingCount > latestCount) {
      console.log('Pending transactions detected, skipping library creation to avoid replacement fee error');
      return null;
    }
    
    const libraryItems = items.map(item => ({
      id: item.id || '',
      title: item.title || '',
      summary: item.summary || '',
      content: item.content || '',
      url: item.url || '',
      image: item.image || '',
      date: item.date || '',
      metadata: item.metadata || JSON.stringify(item)
    }));
    
    const tagsArray = tags || [];
    
    const gasPrice = await provider.getFeeData();
    const overrides = {};
    if (gasPrice.gasPrice) {
      overrides.gasPrice = gasPrice.gasPrice * BigInt(110) / BigInt(100);
    }
    if (gasPrice.maxFeePerGas) {
      overrides.maxFeePerGas = gasPrice.maxFeePerGas * BigInt(110) / BigInt(100);
    }
    if (gasPrice.maxPriorityFeePerGas) {
      overrides.maxPriorityFeePerGas = gasPrice.maxPriorityFeePerGas * BigInt(110) / BigInt(100);
    }
    
    const tx = await contract.createLibrary(
      dataType || 'news',
      tagsArray,
      libraryItems,
      source,
      Object.keys(overrides).length > 0 ? overrides : undefined
    );
    const receipt = await tx.wait();
    
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'LibraryCreated';
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsed = contract.interface.parseLog(event);
      return {
        libraryId: parsed.args.libraryId.toString(),
        txHash: receipt.hash
      };
    }
    
    return { txHash: receipt.hash };
  } catch (error) {
    if (error.code === 'REPLACEMENT_UNDERPRICED' || error.message?.includes('replacement') || error.message?.includes('underpriced')) {
      console.log('Skipping library creation - pending transaction with same nonce');
      return null;
    }
    console.error('Error creating library on-chain:', error);
    return null;
  }
}

/**
 * Get all libraries from chain
 */
async function getAllLibrariesFromChain() {
  try {
    const contract = getMainContract();
    if (!contract) {
      return null;
    }
    
    const result = await contract.getAllLibraries();
    
    const libraries = [];
    for (let i = 0; i < result.libraryIds.length; i++) {
      if (result.libraryIds[i] > 0) {
        libraries.push({
          libraryId: result.libraryIds[i].toString(),
          dataType: result.dataTypes[i],
          timestamp: new Date(Number(result.timestamps[i]) * 1000).toISOString(),
          source: result.sources[i]
        });
      }
    }
    
    return libraries;
  } catch (error) {
    console.error('Error getting all libraries from chain:', error);
    return null;
  }
}

/**
 * Get all stakes with caching support
 */
let stakesCache = null;
let stakesCacheTime = 0;
const CACHE_TTL = 30000; // 30 seconds cache

async function getAllStakes(useCache = true) {
  try {
    // Return cached data if still valid
    if (useCache && stakesCache && (Date.now() - stakesCacheTime) < CACHE_TTL) {
      return stakesCache;
    }
    
    const contract = getMainContract();
    if (!contract) {
      console.error('Contract not initialized. Check MAIN_CONTRACT_ADDRESS in .env');
      return null;
    }
    
    console.log('Calling getStakes() on contract:', MAIN_CONTRACT_ADDRESS);
    const result = await contract.getStakes();
    
    if (!result) {
      console.error('Contract returned null/undefined');
      return null;
    }
    
    // Handle both struct return format and direct array format
    const stakesArray = result.stakes || result[0] || [];
    const totalStakes = result.totalStakes || result[1] || 0;
    const totalAmountStaked = result.totalAmountStaked || result[2] || 0;
    
    const formattedStakes = stakesArray.map((stake, index) => {
      // Handle both struct format and array format
      const stakeData = Array.isArray(stake) ? {
        createdBy: stake[0],
        createdAt: stake[1],
        expiresAt: stake[2],
        libraryId: stake[3],
        rewarded: stake[4],
        predictionCorrect: stake[5] || false,
        stakeUp: stake[6],
        cryptoId: stake[7],
        currentPrice: stake[8],
        predictedPrice: stake[9],
        actualPrice: stake[10] || 0,
        direction: stake[11],
        percentChange: stake[12]
      } : stake;
      
      return {
        stakeId: index + 1,
        createdBy: stakeData.createdBy,
        createdAt: Number(stakeData.createdAt),
        expiresAt: Number(stakeData.expiresAt),
        libraryId: Number(stakeData.libraryId || 0),
        rewarded: stakeData.rewarded,
        predictionCorrect: stakeData.predictionCorrect || false,
        stakeUp: stakeData.stakeUp,
        cryptoId: stakeData.cryptoId,
        currentPrice: stakeData.currentPrice.toString(),
        predictedPrice: stakeData.predictedPrice.toString(),
        actualPrice: stakeData.actualPrice ? stakeData.actualPrice.toString() : '0',
        direction: stakeData.direction,
        percentChange: Number(stakeData.percentChange)
      };
    });
    
    const response = {
      stakes: formattedStakes,
      totalStakes: totalStakes.toString(),
      totalAmountStaked: totalAmountStaked.toString()
    };
    
    // Update cache
    stakesCache = response;
    stakesCacheTime = Date.now();
    
    return response;
  } catch (error) {
    console.error('Error getting all stakes:', error.message || error);
    console.error('Error stack:', error.stack);
    // Return cached data if available even on error
    if (stakesCache) {
      console.log('Returning cached stakes due to error');
      return stakesCache;
    }
    return null;
  }
}

/**
 * Invalidate stakes cache (call after new stake is created)
 */
function invalidateStakesCache() {
  stakesCache = null;
  stakesCacheTime = 0;
}

/**
 * Get cache info for debugging
 */
function getStakesCacheInfo() {
  return {
    cached: !!stakesCache,
    age: stakesCache ? Date.now() - stakesCacheTime : 0,
    ttl: CACHE_TTL
  };
}

/**
 * Get stakes by user address (staker)
 */
async function getStakesByUser(userAddress) {
  try {
    const contract = getMainContract();
    if (!contract) {
      return null;
    }
    
    const stakes = await contract.getStakesByStaker(userAddress);
    
    return stakes.map(stake => ({
      stakeId: stake.stakeId || null,
      createdBy: stake.createdBy,
      staker: stake.staker,
      amount: ethers.formatEther(stake.amount),
      timestamp: new Date(Number(stake.timestamp) * 1000).toISOString(),
      rewarded: stake.rewarded,
      stakeUp: stake.stakeUp,
      cryptoId: stake.cryptoId,
      currentPrice: ethers.formatUnits(stake.currentPrice, 18),
      predictedPrice: ethers.formatUnits(stake.predictedPrice, 18),
      direction: stake.direction,
      percentChange: Number(stake.percentChange) / 100
    }));
  } catch (error) {
    console.error('Error getting stakes by user:', error);
    return null;
  }
}

async function getUserStakesWithDetails(userAddress) {
  try {
    const contract = getMainContract();
    if (!contract) {
      return null;
    }
    
    const allStakesData = await getAllStakes(false);
    if (!allStakesData || !allStakesData.stakes) {
      return [];
    }
    
    const userStakesMap = new Map();
    const now = Math.floor(Date.now() / 1000);
    
    for (let i = 0; i < allStakesData.stakes.length; i++) {
      const stake = allStakesData.stakes[i];
      const stakeId = i + 1;
      
      try {
        const stakers = await contract.getStakersByStake(stakeId);
        
        if (stakers && Array.isArray(stakers)) {
          stakers.forEach((staker) => {
            if (staker.wallet.toLowerCase() === userAddress.toLowerCase()) {
              const expiresAtNum = typeof stake.expiresAt === 'string' ? parseInt(stake.expiresAt) : stake.expiresAt;
              const isExpired = expiresAtNum > 0 && expiresAtNum <= now;
              const isResolved = stake.rewarded;
              const hasActualPrice = stake.actualPrice && stake.actualPrice !== '0';
              
              let amountWei = BigInt(0);
              if (staker.amountInBNB !== undefined && staker.amountInBNB !== null) {
                try {
                  const amountRaw = staker.amountInBNB;
                  
                  if (typeof amountRaw === 'bigint') {
                    amountWei = amountRaw;
                  } else if (typeof amountRaw === 'object' && amountRaw.toString) {
                    amountWei = BigInt(amountRaw.toString());
                  } else if (typeof amountRaw === 'string') {
                    amountWei = BigInt(amountRaw);
                  } else if (typeof amountRaw === 'number') {
                    amountWei = BigInt(amountRaw);
                  } else {
                    amountWei = BigInt(String(amountRaw));
                  }
                  
                  console.log(`Stake ${stakeId}, Staker ${staker.id}: amountInBNB raw:`, amountRaw, 'type:', typeof amountRaw, 'amountWei:', amountWei.toString());
                } catch (err) {
                  console.warn(`Error parsing amount for stake ${stakeId}, staker ${staker.id}:`, err, 'amountInBNB:', staker.amountInBNB, 'type:', typeof staker.amountInBNB);
                  amountWei = BigInt(0);
                }
              } else {
                console.warn(`Stake ${stakeId}, Staker ${staker.id}: amountInBNB is undefined or null`);
              }
              
              const key = `${stakeId}-${staker.stakeUp ? 'up' : 'down'}`;
              
              if (userStakesMap.has(key)) {
                const existing = userStakesMap.get(key);
                const existingAmountWei = BigInt(existing.amountWei || '0');
                const totalWei = existingAmountWei + amountWei;
                existing.amountWei = totalWei.toString();
                existing.amount = ethers.formatEther(totalWei.toString());
                existing.stakerId = Number(staker.id);
                if (staker.rewarded) {
                  existing.rewarded = staker.rewarded;
                }
              } else {
                userStakesMap.set(key, {
                  stakeId,
                  stakerId: Number(staker.id),
                  cryptoId: stake.cryptoId,
                  currentPrice: stake.currentPrice,
                  predictedPrice: stake.predictedPrice,
                  direction: stake.direction,
                  percentChange: Number(stake.percentChange) / 100,
                  amountWei: amountWei.toString(),
                  amount: ethers.formatEther(amountWei.toString()),
                  stakeUp: staker.stakeUp,
                  createdAt: new Date((typeof stake.createdAt === 'string' ? parseInt(stake.createdAt) : stake.createdAt) * 1000).toISOString(),
                  expiresAt: new Date(expiresAtNum * 1000).toISOString(),
                  isExpired,
                  isResolved,
                  rewarded: staker.rewarded,
                  actualPrice: hasActualPrice ? ethers.formatEther(stake.actualPrice) : null,
                  predictionCorrect: stake.predictionCorrect !== undefined ? stake.predictionCorrect : null
                });
              }
            }
          });
        }
      } catch (err) {
        console.warn(`Error fetching stakers for stake ${stakeId}:`, err);
      }
    }
    
    const userStakesList = Array.from(userStakesMap.values());
    
    userStakesList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return userStakesList;
  } catch (error) {
    console.error('Error getting user stakes with details:', error);
    return null;
  }
}

/**
 * Get analytics data
 */
async function getAnalytics() {
  try {
    const contract = getMainContract();
    if (!contract) {
      return null;
    }
    
    const allStakesData = await getAllStakes(false);
    if (!allStakesData || !allStakesData.stakes) {
      return {
        ongoingStakes: 0,
        resolvedStakes: 0,
        uniqueStakers: 0,
        correctPredictions: 0,
        totalStakes: 0,
        totalAmountStaked: '0'
      };
    }
    
    const now = Math.floor(Date.now() / 1000);
    let ongoingStakes = 0;
    let resolvedStakes = 0;
    let uniqueStakers = new Set();
    let correctPredictions = 0;
    
    for (let i = 0; i < allStakesData.stakes.length; i++) {
      const stake = allStakesData.stakes[i];
      const stakeId = i + 1;
      const expiresAtNum = typeof stake.expiresAt === 'string' ? parseInt(stake.expiresAt) : stake.expiresAt;
      const isExpired = expiresAtNum > 0 && expiresAtNum <= now;
      const isResolved = stake.rewarded;
      
      if (isResolved) {
        resolvedStakes++;
        if (stake.predictionCorrect === true) {
          correctPredictions++;
        }
      } else if (!isExpired) {
        ongoingStakes++;
      }
      
      // Get unique stakers for this stake
      try {
        const stakers = await contract.getStakersByStake(stakeId);
        if (stakers && Array.isArray(stakers)) {
          stakers.forEach((staker) => {
            if (staker.wallet) {
              uniqueStakers.add(staker.wallet.toLowerCase());
            }
          });
        }
      } catch (err) {
        console.warn(`Error fetching stakers for stake ${stakeId} in analytics:`, err);
      }
    }
    
    return {
      ongoingStakes,
      resolvedStakes,
      uniqueStakers: uniqueStakers.size,
      correctPredictions,
      totalStakes: allStakesData.stakes.length,
      totalAmountStaked: allStakesData.totalAmountStaked || '0'
    };
  } catch (error) {
    console.error('Error getting analytics:', error);
    return null;
  }
}

/**
 * Get correct predictions for a specific crypto
 * Used to improve AI predictions by learning from past successes
 */
async function getCorrectPredictionsByCrypto(cryptoId) {
  try {
    const contract = getMainContract();
    if (!contract) {
      return [];
    }
    
    const correctStakes = await contract.getCorrectPredictionsByCrypto(cryptoId);
    
    return correctStakes.map(stake => {
      const currentPrice = parseFloat(ethers.formatUnits(stake.currentPrice, 18));
      const actualPrice = parseFloat(ethers.formatUnits(stake.actualPrice, 18));
      const actualPercentChange = ((actualPrice - currentPrice) / currentPrice) * 100;
      
      return {
        createdAt: new Date(Number(stake.createdAt) * 1000).toISOString(),
        currentPrice: currentPrice,
        predictedPrice: parseFloat(ethers.formatUnits(stake.predictedPrice, 18)),
        actualPrice: actualPrice,
        direction: stake.direction,
        percentChange: Number(stake.percentChange) / 100,
        actualPercentChange: actualPercentChange
      };
    });
  } catch (error) {
    console.error(`Error getting correct predictions for ${cryptoId}:`, error);
    return [];
  }
}

/**
 * Get user statistics
 */
async function getUserStats(userAddress) {
  try {
    const contract = getMainContract();
    if (!contract) {
      console.error('Contract not initialized. Check MAIN_CONTRACT_ADDRESS in .env');
      return null;
    }
    
    if (!MAIN_CONTRACT_ADDRESS) {
      console.error('MAIN_CONTRACT_ADDRESS not set in environment variables');
      return null;
    }
    
    const result = await contract.getUserStats(userAddress);
    
    if (!result) {
      return {
        wins: '0',
        losses: '0',
        totalStaked: '0',
        totalWon: '0',
        totalLost: '0',
        winRate: '0'
      };
    }
    
    return {
      wins: result[0].toString(),
      losses: result[1].toString(),
      totalStaked: result[2].toString(),
      totalWon: result[3].toString(),
      totalLost: result[4].toString(),
      winRate: result[5].toString()
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      address: userAddress,
      contractAddress: MAIN_CONTRACT_ADDRESS
    });
    
    if (error.code === 'CALL_EXCEPTION' || error.message?.includes('revert')) {
      return {
        wins: '0',
        losses: '0',
        totalStaked: '0',
        totalWon: '0',
        totalLost: '0',
        winRate: '0'
      };
    }
    
    return null;
  }
}

module.exports = {
  initBlockchain,
  getProvider,
  getPredictionStaking,
  recordPredictionOnChain,
  verifyPredictionOnChain,
  createLibraryOnChain,
  getAllLibrariesFromChain,
  getAllStakes,
  getStakesByUser,
  getUserStakesWithDetails,
  getUserStats,
  getCorrectPredictionsByCrypto,
  getAnalytics,
  invalidateStakesCache,
  getStakesCacheInfo,
  formatBNB,
  parseBNB
};

