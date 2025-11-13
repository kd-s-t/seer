const blockchain = require('../lib/binance');
const openai = require('../lib/openai');
const coingecko = require('../lib/coingecko/prices');

const getStakeablePredictions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const predictions = await blockchain.getStakeablePredictions(limit);
    
    res.json({
      success: true,
      predictions,
      count: predictions.length,
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

    let onChainResult;
    try {
      onChainResult = await blockchain.recordPredictionOnChain(
        cryptoId,
        currentPrice,
        predictedPrice,
        suggestion.direction,
        Math.abs(suggestion.percentChange)
      );
    } catch (error) {
      let errorMessage = 'Failed to record prediction on-chain';
      
      const errorText = error?.error?.message || error?.message || error?.toString() || '';
      
      if (errorText.includes("doesn't have enough funds") || errorText.includes('insufficient funds') || errorText.includes('balance is: 0')) {
        errorMessage = 'Insufficient funds for gas fees. Please fund your wallet with ETH/BNB.';
      } else if (errorText.includes('network') || errorText.includes('connection') || errorText.includes('ECONNREFUSED')) {
        errorMessage = 'Network connection error. Please check your blockchain connection.';
      } else if (errorText.includes('contract') || errorText.includes('not initialized')) {
        errorMessage = 'Contract not found. Please check contract addresses in configuration.';
      } else if (errorText) {
        errorMessage = errorText;
      }
      
      return res.status(500).json({
        success: false,
        error: errorMessage
      });
    }

    if (!onChainResult || !onChainResult.predictionId) {
      return res.status(500).json({
        success: false,
        error: 'Failed to record prediction on-chain. Contract may not be initialized.'
      });
    }

    const predictionId = onChainResult.predictionId;

    res.json({
      success: true,
      predictionId,
      predictionTxHash: onChainResult.txHash,
      expiresAt,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating prediction:', error);
    
    let errorMessage = 'Failed to create prediction';
    
    const errorText = error?.error?.message || error?.message || error?.toString() || '';
    
    if (errorText.includes("doesn't have enough funds") || errorText.includes('insufficient funds') || errorText.includes('balance is: 0')) {
      errorMessage = 'Insufficient funds for gas fees. Please fund your wallet with ETH/BNB.';
    } else if (errorText.includes('network') || errorText.includes('connection') || errorText.includes('ECONNREFUSED')) {
      errorMessage = 'Network connection error. Please check your blockchain connection.';
    } else if (errorText.includes('contract') || errorText.includes('not initialized')) {
      errorMessage = 'Contract not initialized. Please check contract addresses in configuration.';
    } else if (errorText) {
      errorMessage = errorText;
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage
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
        predictions: []
      });
    }
    
    const predictionStaking = require('../lib/binance/predictionStaking');
    const predictions = await predictionStaking.getUserStakesWithData(address);
    
    res.json({
      success: true,
      predictions,
      count: predictions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting user stakes:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user stakes',
      predictions: [],
      count: 0,
      timestamp: new Date().toISOString()
    });
  }
};

const { ethers } = require('ethers');

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
