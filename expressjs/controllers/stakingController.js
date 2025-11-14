const openai = require('../lib/openai');
const coingecko = require('../lib/coingecko/prices');
const { ethers } = require('ethers');

// Get all stakes with caching (long-term solution for timeout issues)
const getStakeablePredictions = async (req, res) => {
  try {
    const blockchain = require('../lib/blockchain');
    const result = await blockchain.getAllStakes(true); // Use cache
    
    if (result === null) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch stakes from blockchain',
        predictions: [],
        count: 0,
        timestamp: new Date().toISOString()
      });
    }
    
    const cacheInfo = blockchain.getStakesCacheInfo();
    
    res.json({
      success: true,
      predictions: result.stakes || [],
      count: result.stakes?.length || 0,
      totalStakes: result.totalStakes || '0',
      totalAmountStaked: result.totalAmountStaked || '0',
      cached: cacheInfo.cached && cacheInfo.age < cacheInfo.ttl,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting stakeable predictions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get stakeable predictions',
      predictions: [],
      count: 0,
      timestamp: new Date().toISOString()
    });
  }
};

// Generate AI prediction suggestion only (no blockchain interaction)
// Frontend should handle recording to blockchain
const createPredictionAndRegister = async (req, res) => {
  try {
    const { cryptoId, symbol } = req.body;
    
    if (!cryptoId || !symbol) {
      return res.status(400).json({
        success: false,
        error: 'cryptoId and symbol are required'
      });
    }

    const priceData = await coingecko.fetchCryptoPrices([cryptoId], 'usd', true);
    const crypto = priceData.find(c => c.id === cryptoId);
    
    if (!crypto) {
      return res.status(404).json({
        success: false,
        error: 'Crypto not found'
      });
    }

    const suggestion = await openai.generatePriceSuggestion(crypto, null, true);
    
    if (!suggestion.direction || !suggestion.percentChange) {
      return res.status(400).json({
        success: false,
        error: 'Failed to generate prediction'
      });
    }

    const currentPrice = crypto.price;
    let predictedPrice;
    
    if (suggestion.direction === 'up') {
      predictedPrice = currentPrice * (1 + suggestion.percentChange / 100);
    } else if (suggestion.direction === 'down') {
      predictedPrice = currentPrice * (1 - suggestion.percentChange / 100);
    } else {
      predictedPrice = currentPrice;
    }

    // Return suggestion data for frontend to record on-chain
    res.json({
      success: true,
      suggestion: {
        cryptoId,
        symbol,
        currentPrice,
        predictedPrice,
        direction: suggestion.direction,
        percentChange: Math.abs(suggestion.percentChange),
        reasoning: suggestion.reasoning,
        newsSources: suggestion.newsSources || []
      },
      message: 'Use this data to record prediction on-chain from frontend',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating prediction suggestion:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate prediction suggestion'
    });
  }
};

const getUserStats = async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'User address is required'
      });
    }
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }
    
    const blockchain = require('../lib/blockchain');
    const stats = await blockchain.getUserStats(address);
    
    if (stats === null) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch user stats from blockchain'
      });
    }
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user stats'
    });
  }
};

const getUserStakes = async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'User address is required',
        stakes: []
      });
    }
      
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format',
        stakes: []
      });
    }
      
    const blockchain = require('../lib/blockchain');
    const stakes = await blockchain.getUserStakesWithDetails(address);
    
    if (stakes === null) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch stakes from blockchain',
        stakes: []
      });
    }
    
    res.json({
      success: true,
      stakes: stakes,
      count: stakes.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting user stakes:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user stakes',
      stakes: []
    });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const blockchain = require('../lib/blockchain');
    const analytics = await blockchain.getAnalytics();
    
    if (analytics === null) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch analytics from blockchain',
        analytics: null
      });
    }
    
    res.json({
      success: true,
      analytics: analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get analytics',
      analytics: null
    });
  }
};

// Deprecated: Blockchain interactions moved to frontend
const getClaimablePredictions = async (req, res) => {
  try {
    const { address } = req.query;
    const limit = parseInt(req.query.limit) || 50;
    
    const claimable = [];
    
    res.json({
      success: true,
      predictions: claimable,
      count: claimable.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting claimable predictions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get claimable predictions',
      predictions: [],
      count: 0,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getStakeablePredictions,
  getUserStats,
  getUserStakes,
  getClaimablePredictions,
  createPredictionAndRegister,
  getAnalytics
};
