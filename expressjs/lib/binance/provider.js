const { ethers } = require('ethers');
require('dotenv').config();

const BNB_TESTNET_RPC = process.env.BNB_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545';
const BNB_MAINNET_RPC = process.env.BNB_MAINNET_RPC || 'https://bsc-dataseed.binance.org/';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const NETWORK = process.env.NETWORK || 'testnet';

let provider;
let wallet;

function initProvider(network = NETWORK) {
  try {
    let rpcUrl;
    if (network === 'localhost' || network === 'local') {
      rpcUrl = 'http://localhost:8545';
    } else if (network === 'mainnet') {
      rpcUrl = BNB_MAINNET_RPC;
    } else {
      rpcUrl = BNB_TESTNET_RPC;
    }
    provider = new ethers.JsonRpcProvider(rpcUrl);
    
    if (PRIVATE_KEY) {
      wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    }
    
    return { provider, wallet };
  } catch (error) {
    console.error('Error initializing provider:', error);
    throw error;
  }
}

function getProvider() {
  if (!provider) {
    initProvider();
  }
  return provider;
}

function getWallet() {
  if (!wallet && PRIVATE_KEY) {
    initProvider();
  }
  return wallet;
}

module.exports = {
  initProvider,
  getProvider,
  getWallet
};

