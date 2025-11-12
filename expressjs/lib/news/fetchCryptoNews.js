const axios = require('axios');

const NEWS_API_KEY = process.env.THENEWS_API_KEY || '';
const NEWS_API_URL = 'https://api.thenewsapi.net/crypto';

const CACHE_TTL = 6 * 60 * 60 * 1000;
const newsCache = {
  data: null,
  timestamp: null
};

async function fetchCryptoNews(count = 6) {
  try {
    if (!NEWS_API_KEY) {
      return {
        success: false,
        news: [],
        message: 'THENEWS_API_KEY not configured. Using fallback.'
      };
    }

    if (newsCache.data && newsCache.timestamp && Date.now() - newsCache.timestamp < CACHE_TTL) {
      console.log('Using cached news data');
      return {
        success: true,
        news: newsCache.data.slice(0, count),
        cached: true
      };
    }

    const response = await axios.get(NEWS_API_URL, {
      params: {
        apikey: NEWS_API_KEY
      },
      timeout: 10000
    });

    console.log('API Response structure:', {
      isArray: Array.isArray(response.data),
      hasData: !!response.data?.data,
      keys: response.data ? Object.keys(response.data) : [],
      type: typeof response.data,
      status: response.status,
      dataIsArray: Array.isArray(response.data?.data),
      dataLength: response.data?.data ? (Array.isArray(response.data.data) ? response.data.data.length : 'not array') : 'no data',
      dataSample: response.data?.data ? (Array.isArray(response.data.data) ? response.data.data[0] : response.data.data) : null
    });

    if (response.data && response.data.error) {
      console.error('API Error:', response.data.error);
      return {
        success: false,
        news: [],
        message: response.data.error || 'API returned an error'
      };
    }

    const processNewsItems = (items) => {
      if (!items || !Array.isArray(items) || items.length === 0) {
        console.log('No items to process or not an array');
        return [];
      }

      console.log(`Processing ${items.length} items`);

      const processed = items
        .map((item, index) => {
          const publishedDate = item.published_at || item.date || item.pub_date || item.created_at;
          let dateObj = null;
          
          if (publishedDate) {
            dateObj = new Date(publishedDate);
            if (isNaN(dateObj.getTime())) {
              dateObj = null;
            }
          }
          
          const sourceName = item.source?.name || item.source || item.source_name || item.domain || item.author || '';
          
          const newsItem = {
            title: item.title || item.headline || item.name || `News ${index + 1}`,
            summary: item.description || item.summary || item.snippet || item.text || item.content || item.body || '',
            date: dateObj ? dateObj.toLocaleDateString() : '',
            dateObj: dateObj,
            source: sourceName,
            url: item.url || item.link || item.web_url || item.permalink || '',
            image: item.thumbnail || item.image_url || item.image || item.url_to_image || item.media || null
          };

          return newsItem;
        })
        .filter(item => {
          if (!item.title || item.title === `News ${items.indexOf(item) + 1}`) {
            console.log('Filtered out item - missing title');
            return false;
          }
          if (!item.summary) {
            console.log('Item missing summary, using title as summary:', item.title);
            item.summary = item.title;
          }
          return true;
        })
        .sort((a, b) => {
          if (!a.dateObj && !b.dateObj) return 0;
          if (!a.dateObj) return 1;
          if (!b.dateObj) return -1;
          return b.dateObj - a.dateObj;
        })
        .slice(0, count)
        .map(({ dateObj, ...item }) => item);

      console.log(`After processing: ${processed.length} items`);
      return processed;
    };

    let news = [];

    if (response.data && Array.isArray(response.data)) {
      console.log('Using response.data as array');
      news = processNewsItems(response.data);
    } else if (response.data && response.data.data && response.data.data.results && Array.isArray(response.data.data.results)) {
      console.log('Using response.data.data.results as array, length:', response.data.data.results.length);
      news = processNewsItems(response.data.data.results);
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      console.log('Using response.data.data as array, length:', response.data.data.length);
      news = processNewsItems(response.data.data);
    } else if (response.data && response.data.news && Array.isArray(response.data.news)) {
      news = processNewsItems(response.data.news);
    } else if (response.data && response.data.articles && Array.isArray(response.data.articles)) {
      news = processNewsItems(response.data.articles);
    } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
      news = processNewsItems(response.data.results);
    } else if (response.data && typeof response.data === 'object') {
      console.log('Response is object but not in expected format. Trying to extract any array...');
      for (const key in response.data) {
        if (Array.isArray(response.data[key])) {
          console.log(`Found array in key: ${key}`);
          news = processNewsItems(response.data[key]);
          break;
        }
      }
      if (response.data.data && typeof response.data.data === 'object') {
        for (const key in response.data.data) {
          if (Array.isArray(response.data.data[key])) {
            console.log(`Found array in response.data.data.${key}`);
            news = processNewsItems(response.data.data[key]);
            break;
          }
        }
      }
    }

    if (news.length > 0) {
      newsCache.data = news;
      newsCache.timestamp = Date.now();
      console.log('Cached news data for 6 hours');
      return {
        success: true,
        news: news.slice(0, count)
      };
    }

    const responseStr = JSON.stringify(response.data, null, 2);
    console.log('Full API Response:', responseStr);
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    return {
      success: false,
      news: [],
      message: `API returned data but no news found. Response type: ${typeof response.data}, Is Array: ${Array.isArray(response.data)}, Keys: ${response.data ? Object.keys(response.data).join(', ') : 'null'}`,
      debug: {
        responseType: typeof response.data,
        isArray: Array.isArray(response.data),
        keys: response.data ? Object.keys(response.data) : null,
        responsePreview: responseStr.substring(0, 500)
      }
    };
  } catch (error) {
    console.error('Error fetching news from TheNewsAPI:', error.message);
    
    if (error.response) {
      console.error('API Response:', error.response.status, error.response.data);
    }

    return {
      success: false,
      news: [],
      message: error.message || 'Failed to fetch news'
    };
  }
}

module.exports = fetchCryptoNews;

