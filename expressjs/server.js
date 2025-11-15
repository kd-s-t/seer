const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3016;

const allowedOrigins = [
  process.env.SEERY_FRONTEND_DOMAIN,
  'http://localhost:3015',
  'https://theseery.com',
  'http://theseery.com',
  'https://www.theseery.com',
  'http://www.theseery.com',
  'http://54.87.228.171',
  'http://54.87.228.171:3015'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some(allowed => origin && origin.includes(allowed.replace(/^https?:\/\//, '')))) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));
app.use(express.json());

// Blockchain interactions moved to frontend - no backend blockchain initialization needed

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
  console.log(`🤖 AI: ${process.env.OPENAI_API_KEY ? 'Enabled' : 'Disabled'}`);
  console.log(`📰 News API: ${process.env.THENEWS_API_KEY ? 'Enabled' : 'Disabled'}`);
  console.log(`💱 CoinGecko: Enabled`);
  console.log(`📊 Mode: API-only (blockchain interactions in frontend)`);
});
