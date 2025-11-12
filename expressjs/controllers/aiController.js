const openai = require('../lib/openai');
const blockchain = require('../lib/binance');

const generateMarkets = async (req, res) => {
  try {
    const { topic, count } = req.body;
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        error: 'AI features are disabled. OPENAI_API_KEY not configured.',
        errorCode: 'AI_DISABLED',
        helpUrl: 'https://platform.openai.com/api-keys',
        message: 'To enable AI features, add OPENAI_API_KEY to your .env file. The app works without AI - you can create markets manually.'
      });
    }
    
    const markets = await openai.generateMarketsFromNews(
      topic || 'cryptocurrency',
      count || 3
    );
    
    res.json({
      success: true,
      markets,
      count: markets.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating markets:', error);
    
    const errorMessage = error.message || '';
    const statusCode = error.status || error.response?.status || 500;
    
    let userMessage = 'Failed to generate markets';
    if (errorMessage.includes('not configured') || errorMessage.includes('disabled')) {
      return res.status(503).json({
        success: false,
        error: 'AI features are disabled. OPENAI_API_KEY not configured.',
        errorCode: 'AI_DISABLED',
        helpUrl: 'https://platform.openai.com/api-keys'
      });
    }
    
    if (statusCode === 429 || errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('exceeded your current quota')) {
      userMessage = 'OpenAI API quota exceeded. Please check your OpenAI account billing and usage limits.';
      res.status(429).json({
        success: false,
        error: userMessage,
        errorCode: 'QUOTA_EXCEEDED',
        helpUrl: 'https://platform.openai.com/account/billing',
        details: 'This usually means: 1) No payment method added, 2) Spending limit reached, or 3) Rate limit exceeded. Check your billing at https://platform.openai.com/account/billing',
        solutions: [
          'Add a payment method at https://platform.openai.com/account/billing',
          'Increase your spending limit at https://platform.openai.com/account/billing/limits',
          'Wait a few minutes and try again (if rate limited)',
          'Check your usage at https://platform.openai.com/usage'
        ]
      });
    } else if (errorMessage.includes('rate limit')) {
      userMessage = 'OpenAI API rate limit exceeded. Please try again in a moment.';
      res.status(429).json({
        success: false,
        error: userMessage,
        errorCode: 'RATE_LIMIT'
      });
    } else {
      res.status(statusCode).json({
        success: false,
        error: userMessage
      });
    }
  }
};

const analyzeNews = async (req, res) => {
  try {
    const { topic, articleCount } = req.body;
    
    const result = await openai.analyzeNewsForMarkets(
      topic || 'bitcoin',
      articleCount || 5
    );
    
    res.json({
      success: true,
      news: result.news,
      suggestedMarkets: result.markets,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error analyzing news:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze news'
    });
  }
};

module.exports = {
  generateMarkets,
  analyzeNews
};

