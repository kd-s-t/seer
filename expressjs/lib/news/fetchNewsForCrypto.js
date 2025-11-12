const axios = require('axios');

async function fetchNewsForCrypto(cryptoName, cryptoSymbol) {
  try {
    const NEWS_API_KEY = process.env.THENEWS_API_KEY;
    if (!NEWS_API_KEY) {
      return [];
    }

    const searchTerms = [cryptoName, cryptoSymbol].filter(Boolean).join(' OR ');
    const response = await axios.get('https://api.thenewsapi.net/v1/news/search', {
      params: {
        api_token: NEWS_API_KEY,
        search: searchTerms,
        language: 'en',
        limit: 5,
        sort: 'published_at',
        sort_direction: 'desc'
      },
      timeout: 10000
    });

    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data.map(item => ({
        title: item.title || '',
        summary: item.snippet || item.description || '',
        source: item.source?.name || item.source || '',
        url: item.url || '',
        date: item.published_at || '',
        sentiment: 'neutral',
        impact: 'medium'
      })).filter(item => item.title && item.summary);
    }
    return [];
  } catch (error) {
    console.warn(`Error fetching news for ${cryptoSymbol}:`, error.message);
    return [];
  }
}

module.exports = fetchNewsForCrypto;

