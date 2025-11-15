const getConfig = (req, res) => {
  const contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS || 
                         process.env.MAIN_CONTRACT_ADDRESS || 
                         process.env.PREDICTION_STAKING_ADDRESS || 
                         process.env.CONTRACT_ADDRESS || 
                         null;
  
  res.json({
    success: true,
    walletAddress: process.env.BLOCKCHAIN_WALLET_ADDRESS || process.env.CONTRACT_ADDRESS || null,
    predictionStakingAddress: contractAddress,
    contractAddress: contractAddress,
    network: process.env.BLOCKCHAIN_NETWORK || process.env.NETWORK || 'testnet',
    timestamp: new Date().toISOString()
  });
};

const getHealth = (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Prediction Market API is running (Blockchain-only mode)',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getConfig,
  getHealth
};

