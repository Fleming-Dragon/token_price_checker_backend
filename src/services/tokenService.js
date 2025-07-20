const axios = require('axios');

class TokenService {
  constructor() {
    this.coinGeckoBaseUrl =
      process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3';
    this.coinMarketCapBaseUrl =
      process.env.COINMARKETCAP_BASE_URL || 'https://pro-api.coinmarketcap.com';
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  // Get cached data or fetch new data
  async getCachedData(key, fetchFunction) {
    const cachedData = this.cache.get(key);

    if (cachedData && Date.now() - cachedData.timestamp < this.cacheExpiry) {
      return cachedData.data;
    }

    try {
      const data = await fetchFunction();
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });
      return data;
    } catch (error) {
      // Return cached data if available, even if expired
      if (cachedData) {
        console.warn('API call failed, returning cached data:', error.message);
        return cachedData.data;
      }
      throw error;
    }
  }

  // Get all tokens from CoinGecko
  async getAllTokens(options = {}) {
    const { page = 1, limit = 100, sort = 'market_cap_desc' } = options;
    const cacheKey = `all_tokens_${page}_${limit}_${sort}`;

    return this.getCachedData(cacheKey, async() => {
      try {
        const response = await axios.get(
          `${this.coinGeckoBaseUrl}/coins/markets`,
          {
            params: {
              vs_currency: 'usd',
              order: sort,
              per_page: limit,
              page: page,
              sparkline: false,
              price_change_percentage: '1h,24h,7d'
            },
            timeout: 10000
          }
        );

        return response.data.map((token) => ({
          id: token.id,
          symbol: token.symbol.toUpperCase(),
          name: token.name,
          image: token.image,
          current_price: token.current_price,
          market_cap: token.market_cap,
          market_cap_rank: token.market_cap_rank,
          fully_diluted_valuation: token.fully_diluted_valuation,
          total_volume: token.total_volume,
          high_24h: token.high_24h,
          low_24h: token.low_24h,
          price_change_24h: token.price_change_24h,
          price_change_percentage_24h: token.price_change_percentage_24h,
          price_change_percentage_1h_in_currency:
            token.price_change_percentage_1h_in_currency,
          price_change_percentage_7d_in_currency:
            token.price_change_percentage_7d_in_currency,
          circulating_supply: token.circulating_supply,
          total_supply: token.total_supply,
          max_supply: token.max_supply,
          last_updated: token.last_updated
        }));
      } catch (error) {
        console.error('Error fetching tokens from CoinGecko:', error.message);
        throw new Error('Failed to fetch token data from external API');
      }
    });
  }

  // Get specific token by symbol
  async getTokenBySymbol(symbol) {
    const cacheKey = `token_${symbol}`;

    return this.getCachedData(cacheKey, async() => {
      try {
        // First, get the coin ID from symbol
        const coinsListResponse = await axios.get(
          `${this.coinGeckoBaseUrl}/coins/list`,
          {
            timeout: 10000
          }
        );

        const coin = coinsListResponse.data.find(
          (coin) => coin.symbol.toUpperCase() === symbol.toUpperCase()
        );

        if (!coin) {
          return null;
        }

        // Get detailed information about the coin
        const coinResponse = await axios.get(
          `${this.coinGeckoBaseUrl}/coins/${coin.id}`,
          {
            params: {
              localization: false,
              tickers: false,
              market_data: true,
              community_data: false,
              developer_data: false,
              sparkline: false
            },
            timeout: 10000
          }
        );

        const coinData = coinResponse.data;

        return {
          id: coinData.id,
          symbol: coinData.symbol.toUpperCase(),
          name: coinData.name,
          description: coinData.description?.en || '',
          image: coinData.image?.large || coinData.image?.small,
          homepage: coinData.links?.homepage?.[0] || '',
          blockchain_site: coinData.links?.blockchain_site || [],
          market_cap_rank: coinData.market_cap_rank,
          current_price: coinData.market_data?.current_price?.usd,
          market_cap: coinData.market_data?.market_cap?.usd,
          total_volume: coinData.market_data?.total_volume?.usd,
          high_24h: coinData.market_data?.high_24h?.usd,
          low_24h: coinData.market_data?.low_24h?.usd,
          price_change_24h: coinData.market_data?.price_change_24h,
          price_change_percentage_24h:
            coinData.market_data?.price_change_percentage_24h,
          circulating_supply: coinData.market_data?.circulating_supply,
          total_supply: coinData.market_data?.total_supply,
          max_supply: coinData.market_data?.max_supply,
          last_updated: coinData.last_updated
        };
      } catch (error) {
        console.error(`Error fetching token ${symbol}:`, error.message);
        throw new Error(`Failed to fetch token data for ${symbol}`);
      }
    });
  }

  // Search tokens by name or symbol
  async searchTokens(query, limit = 10) {
    const cacheKey = `search_${query}_${limit}`;

    return this.getCachedData(cacheKey, async() => {
      try {
        const response = await axios.get(`${this.coinGeckoBaseUrl}/search`, {
          params: {
            query: query
          },
          timeout: 10000
        });

        const coins = response.data.coins || [];

        return coins.slice(0, limit).map((coin) => ({
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          image: coin.large || coin.thumb,
          market_cap_rank: coin.market_cap_rank
        }));
      } catch (error) {
        console.error('Error searching tokens:', error.message);
        throw new Error('Failed to search tokens');
      }
    });
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

module.exports = new TokenService();
