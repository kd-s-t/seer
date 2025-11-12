const express = require('express');
const cors = require('cors');
require('dotenv').config();

const blockchain = require('./lib/binance');

const app = express();
const PORT = 3016;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3015',
  credentials: true
}));
app.use(express.json());

blockchain.initBlockchain(process.env.NETWORK || 'testnet');

const aiRoutes = require('./routes/ai');
const newsRoutes = require('./routes/news');
const cryptoRoutes = require('./routes/crypto');
const configRoutes = require('./routes/config');
const tradingRoutes = require('./routes/trading');
const stakingRoutes = require('./routes/staking');
const aiController = require('./controllers/aiController');
const configController = require('./controllers/configController');
const cryptoController = require('./controllers/cryptoController');

app.use('/api/ai', aiRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/crypto', cryptoRoutes);
app.get('/api/market-prediction', cryptoController.getCryptoPrices);
app.use('/api/config', configRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/staking', stakingRoutes);

app.get('/api/news/test', (req, res) => {
  res.json({ success: true, message: 'News route is working' });
});
app.get('/health', configController.getHealth);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Prediction Market API running on http://localhost:${PORT}`);
  console.log(`⛓️  Blockchain: ${process.env.CONTRACT_ADDRESS ? 'Connected' : 'No contract address set'}`);
  console.log(`🤖 AI: ${process.env.OPENAI_API_KEY ? 'Enabled' : 'Disabled'}`);
  console.log(`📊 Mode: Blockchain-only (no database)`);
});
