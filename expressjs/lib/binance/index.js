const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

const BINANCE_API_KEY = process.env.BINANCE_API_KEY;
const BINANCE_SECRET_KEY = process.env.BINANCE_SECRET_KEY;
const BINANCE_TESTNET = process.env.BINANCE_TESTNET === 'true' || !BINANCE_API_KEY;
const BINANCE_BASE_URL = process.env.BINANCE_BASE_URL || 'https://api.binance.com';

const BASE_URL = BINANCE_TESTNET 
  ? 'https://testnet.binance.vision/api/v3'
  : `${BINANCE_BASE_URL}/api/v3`;

function generateSignature(queryString) {
  if (!BINANCE_SECRET_KEY) {
    throw new Error('BINANCE_SECRET_KEY not configured');
  }
  return crypto
    .createHmac('sha256', BINANCE_SECRET_KEY)
    .update(queryString)
    .digest('hex');
}

async function makeAuthenticatedRequest(method, endpoint, params = {}) {
  if (!BINANCE_API_KEY) {
    throw new Error('BINANCE_API_KEY not configured. Trading is disabled.');
  }

  const timestamp = Date.now();
  const queryString = new URLSearchParams({
    ...params,
    timestamp,
  }).toString();

  const signature = generateSignature(queryString);
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`;

  try {
    const response = await axios({
      method,
      url,
      headers: {
        'X-MBX-APIKEY': BINANCE_API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`Binance API error: ${error.response.data.msg || error.response.statusText}`);
    }
    throw error;
  }
}

async function placeOrder(symbol, side, type, quantity, price = null, quoteOrderQty = null) {
  const params = {
    symbol: symbol.toUpperCase(),
    side: side.toUpperCase(),
    type: type.toUpperCase(),
  };

  if (type.toUpperCase() === 'MARKET') {
    if (quoteOrderQty) {
      params.quoteOrderQty = quoteOrderQty;
    } else if (quantity) {
      params.quantity = quantity;
    }
  } else {
    if (!price) {
      throw new Error('Price is required for LIMIT orders');
    }
    params.price = price;
    params.quantity = quantity;
    params.timeInForce = 'GTC';
  }

  return makeAuthenticatedRequest('POST', '/order', params);
}

async function getAccountInfo() {
  return makeAuthenticatedRequest('GET', '/account');
}

async function getSymbolPrice(symbol) {
  try {
    const response = await axios.get(`${BASE_URL}/ticker/price`, {
      params: { symbol: symbol.toUpperCase() },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`Binance API error: ${error.response.data.msg || error.response.statusText}`);
    }
    throw error;
  }
}

async function getOrderStatus(symbol, orderId) {
  return makeAuthenticatedRequest('GET', '/order', {
    symbol: symbol.toUpperCase(),
    orderId,
  });
}

const predictionStaking = require('./predictionStaking');
const provider = require('./provider');
const utils = require('./utils');

module.exports = {
  placeOrder,
  getAccountInfo,
  getSymbolPrice,
  getOrderStatus,
  BINANCE_TESTNET,
  initBlockchain: provider.initProvider,
  getProvider: provider.getProvider,
  getPredictionStaking: predictionStaking.getPredictionStaking,
  recordPredictionOnChain: async (cryptoId, currentPrice, predictedPrice, direction, percentChange) => {
    const staking = predictionStaking.getPredictionStaking();
    if (!staking) return null;
    const { ethers } = require('ethers');
    const currentPriceWei = ethers.parseUnits(currentPrice.toString(), 18);
    const predictedPriceWei = ethers.parseUnits(predictedPrice.toString(), 18);
    const percentChangeScaled = Math.round(percentChange * 100);
    const tx = await staking.recordPrediction(cryptoId, currentPriceWei, predictedPriceWei, direction, percentChangeScaled);
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
      return { predictionId: parsed.args.predictionId.toString(), txHash: receipt.hash };
    }
    return { txHash: receipt.hash };
  },
  verifyPredictionOnChain: async (predictionId, actualPrice) => {
    const staking = predictionStaking.getPredictionStaking();
    if (!staking) throw new Error('PredictionStaking not initialized');
    const { ethers } = require('ethers');
    const { getWallet } = require('./provider');
    const wallet = getWallet();
    if (!wallet) throw new Error('Wallet not initialized');
    const actualPriceWei = ethers.parseUnits(actualPrice.toString(), 18);
    const tx = await staking.verifyPrediction(predictionId, actualPriceWei);
    await tx.wait();
    return tx.hash;
  },
  getUserStakedPredictions: predictionStaking.getUserStakedPredictions,
  claimRewards: predictionStaking.claimRewards,
  formatBNB: utils.formatBNB,
  parseBNB: utils.parseBNB
};

