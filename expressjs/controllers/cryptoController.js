const coingecko = require('../lib/coingecko/prices');
const openai = require('../lib/openai');
const blockchain = require('../lib/binance');

const getCryptoPrices = async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        error: 'AI service unavailable. OPENAI_API_KEY not configured.',
        cryptos: [],
        timestamp: new Date().toISOString()
      });
    }

    let symbols = req.query.symbols ? req.query.symbols.split(',').filter(Boolean) : null;
    const tags = req.query.tags ? req.query.tags.split(',').filter(Boolean) : null;
    const currency = req.query.currency || 'usd';
    const forceRefresh = !!req.query._t;
    
    let requestedSymbols = null;
    if (tags && tags.length > 0) {
      requestedSymbols = [...tags];
      symbols = [...tags];
    } else if (!symbols || symbols.length === 0) {
      symbols = await coingecko.getTrendingCryptos();
      requestedSymbols = [...symbols];
    } else {
      requestedSymbols = [...symbols];
    }
    
    if (!requestedSymbols || requestedSymbols.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Either symbols or tags parameter is required',
        cryptos: [],
        timestamp: new Date().toISOString()
      });
    }
    
    const priceData = await coingecko.fetchCryptoPrices(symbols, currency, forceRefresh);
    
    const requestedIds = new Set(requestedSymbols);
    const requestedCryptoMap = new Map();
    priceData.forEach(crypto => {
      if (requestedIds.has(crypto.id)) {
        requestedCryptoMap.set(crypto.id, crypto);
      }
    });
    
    const finalData = requestedSymbols
      .map(id => requestedCryptoMap.get(id))
      .filter(Boolean);
    
    const shouldBypassAICache = forceRefresh;
    const cryptosWithSuggestions = await Promise.all(
      finalData.map(async (crypto) => {
        try {
          const suggestion = await openai.generatePriceSuggestion(crypto, tags, shouldBypassAICache);
          
          let predictionId = null;
          let predictionTxHash = null;
          
          console.log(`[${crypto.symbol}] Suggestion:`, { direction: suggestion.direction, percentChange: suggestion.percentChange, forceRefresh });
          
          if (suggestion.direction && suggestion.percentChange && forceRefresh) {
            console.log(`[${crypto.symbol}] Attempting to record prediction on-chain...`);
            const currentPrice = crypto.price;
            let predictedPrice;
            
            if (suggestion.direction === 'up') {
              predictedPrice = currentPrice * (1 + suggestion.percentChange / 100);
            } else if (suggestion.direction === 'down') {
              predictedPrice = currentPrice * (1 - suggestion.percentChange / 100);
            } else {
              predictedPrice = currentPrice;
            }
            
            try {
              const onChainResult = await blockchain.recordPredictionOnChain(
                crypto.id,
                currentPrice,
                predictedPrice,
                suggestion.direction,
                Math.abs(suggestion.percentChange)
              );
              
              if (onChainResult && onChainResult.predictionId) {
                predictionId = onChainResult.predictionId;
                predictionTxHash = onChainResult.txHash || null;
                
                
                console.log(`Recorded prediction on-chain for ${crypto.symbol}:`, onChainResult);
              }
            } catch (onChainError) {
              console.error(`Failed to record prediction on-chain for ${crypto.symbol}:`, onChainError.message);
            }
          }
          
          return {
            ...crypto,
            suggestion: suggestion.direction,
            suggestionPercent: suggestion.percentChange,
            reasoning: suggestion.reasoning,
            newsSources: suggestion.newsSources || [],
            predictionId: predictionId,
            predictionTxHash: predictionTxHash
          };
        } catch (error) {
          console.error(`Error generating suggestion for ${crypto.symbol}:`, error);
          return {
            ...crypto,
            suggestion: null,
            suggestionPercent: null,
            reasoning: 'Failed to generate suggestion'
          };
        }
      })
    );
    
    const response = {
      success: true,
      cryptos: cryptosWithSuggestions,
      tags: tags || [],
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch crypto prices',
      cryptos: [],
      timestamp: new Date().toISOString()
    });
  }
};

const searchCrypto = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required',
        results: [],
        count: 0,
        timestamp: new Date().toISOString()
      });
    }
    
    const results = await coingecko.searchCrypto(query);
    
    res.json({
      success: true,
      results,
      count: results.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error searching crypto:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search crypto',
      results: [],
      count: 0,
      timestamp: new Date().toISOString()
    });
  }
};

const getCryptoLibrary = async (req, res) => {
  try {
    const library = await coingecko.getCryptoLibrary();
    
    res.json({
      success: true,
      library,
      count: library.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching crypto library:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch crypto library',
      library: [],
      count: 0,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getCryptoPrices,
  searchCrypto,
  getCryptoLibrary
};

