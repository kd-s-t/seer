const express = require('express');
const cors = require('cors');
require('dotenv').config();

const blockchain = require('./blockchain');

const app = express();
const PORT = 3016;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3015',
  credentials: true
}));
app.use(express.json());

blockchain.initBlockchain(process.env.NETWORK || 'testnet');

const marketsRoutes = require('./routes/markets');
const aiRoutes = require('./routes/ai');
const newsRoutes = require('./routes/news');
const cryptoRoutes = require('./routes/crypto');
const configRoutes = require('./routes/config');
const usersRoutes = require('./routes/users');
const tradingRoutes = require('./routes/trading');
const aiController = require('./controllers/aiController');
const configController = require('./controllers/configController');

app.use('/api/markets', marketsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/market-prediction', cryptoRoutes);
app.use('/api/config', configRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/trading', tradingRoutes);

app.get('/api/news/test', (req, res) => {
  res.json({ success: true, message: 'News route is working' });
});
app.get('/api/markets/:id/ai-resolution', aiController.getMarketAIResolution);
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
