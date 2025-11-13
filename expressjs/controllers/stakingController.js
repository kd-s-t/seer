const openai = require('../lib/openai');
const coingecko = require('../lib/coingecko/prices');

// Deprecated: Blockchain interactions moved to frontend
// This endpoint is kept for backward compatibility but returns empty
const getStakeablePredictions = async (req, res) => {
  res.json({
    success: true,
    predictions: [],
    count: 0,
    message: 'This endpoint is deprecated. Use frontend blockchain calls instead.',
    timestamp: new Date().toISOString()
  });
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

// Deprecated: Blockchain interactions moved to frontend
// This endpoint is kept for backward compatibility but returns empty
const getUserStakes = async (req, res) => {
  const { address } = req.params;
  
  if (!address) {
    return res.status(400).json({
      success: false,
      error: 'User address is required',
      predictions: []
    });
  }
  
  res.json({
    success: true,
    predictions: [],
    count: 0,
    message: 'This endpoint is deprecated. Use frontend blockchain calls (getStakesByUser) instead.',
    timestamp: new Date().toISOString()
  });
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
  getUserStakes,
  getClaimablePredictions,
  createPredictionAndRegister
};
