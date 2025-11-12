const getConfig = (req, res) => {
  res.json({
    success: true,
    contractAddress: process.env.CONTRACT_ADDRESS || null,
    predictionStakingAddress: process.env.PREDICTION_STAKING_ADDRESS || null,
    network: process.env.NETWORK || 'testnet',
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

