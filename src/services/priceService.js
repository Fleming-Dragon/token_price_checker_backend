const axios = require('axios');

class PriceService {
  constructor() {
    this.coinGeckoBaseUrl =
      process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3';
    this.coinMarketCapBaseUrl =
      process.env.COINMARKETCAP_BASE_URL || 'https://pro-api.coinmarketcap.com';
    this.binanceBaseUrl =
      process.env.BINANCE_BASE_URL || 'https://api.binance.com';
    this.cache = new Map();
    this.cacheExpiry = 30 * 1000; // 30 seconds for price data
  }

  // Get cached data or fetch new data
  async getCachedData(key, fetchFunction, customExpiry = null) {
    const cachedData = this.cache.get(key);
    const expiry = customExpiry || this.cacheExpiry;

    if (cachedData && Date.now() - cachedData.timestamp < expiry) {
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

  // Get current price for a token
  async getTokenPrice(symbol, currency = 'USD') {
    const cacheKey = `price_${symbol}_${currency}`;

    return this.getCachedData(cacheKey, async() => {
      try {
        // Try CoinGecko first
        const response = await axios.get(
          `${this.coinGeckoBaseUrl}/simple/price`,
          {
            params: {
              ids: await this.getTokenIdBySymbol(symbol),
              vs_currencies: currency.toLowerCase(),
              include_market_cap: true,
              include_24hr_vol: true,
              include_24hr_change: true,
              include_last_updated_at: true
            },
            timeout: 10000
          }
        );

        const tokenId = await this.getTokenIdBySymbol(symbol);
        const priceData = response.data[tokenId];

        if (!priceData) {
          throw new Error(`Price data not found for ${symbol}`);
        }

        return {
          symbol: symbol.toUpperCase(),
          currency: currency.toUpperCase(),
          price: priceData[currency.toLowerCase()],
          market_cap: priceData[`${currency.toLowerCase()}_market_cap`],
          volume_24h: priceData[`${currency.toLowerCase()}_24h_vol`],
          change_24h: priceData[`${currency.toLowerCase()}_24h_change`],
          last_updated: new Date(
            priceData.last_updated_at * 1000
          ).toISOString(),
          source: 'CoinGecko'
        };
      } catch (error) {
        console.error(`Error fetching price for ${symbol}:`, error.message);

        // Fallback to Binance for major pairs
        try {
          return await this.getBinancePrice(symbol, currency);
        } catch (binanceError) {
          console.error(
            `Binance fallback failed for ${symbol}:`,
            binanceError.message
          );
          throw new Error(`Failed to fetch price for ${symbol}`);
        }
      }
    });
  }

  // Get price from Binance as fallback
  async getBinancePrice(symbol, currency = 'USDT') {
    try {
      const pair = `${symbol}${currency}`;
      const response = await axios.get(
        `${this.binanceBaseUrl}/api/v3/ticker/24hr`,
        {
          params: {
            symbol: pair
          },
          timeout: 10000
        }
      );

      return {
        symbol: symbol.toUpperCase(),
        currency: currency.toUpperCase(),
        price: parseFloat(response.data.lastPrice),
        change_24h: parseFloat(response.data.priceChangePercent),
        volume_24h: parseFloat(response.data.volume),
        high_24h: parseFloat(response.data.highPrice),
        low_24h: parseFloat(response.data.lowPrice),
        last_updated: new Date().toISOString(),
        source: 'Binance'
      };
    } catch (error) {
      throw new Error(`Binance API error for ${symbol}: ${error.message}`);
    }
  }

  // Get token ID by symbol (for CoinGecko)
  async getTokenIdBySymbol(symbol) {
    const cacheKey = `token_id_${symbol}`;

    return this.getCachedData(
      cacheKey,
      async() => {
        const response = await axios.get(
          `${this.coinGeckoBaseUrl}/coins/list`,
          {
            timeout: 10000
          }
        );

        const coin = response.data.find(
          (coin) => coin.symbol.toUpperCase() === symbol.toUpperCase()
        );

        if (!coin) {
          throw new Error(`Token not found: ${symbol}`);
        }

        return coin.id;
      },
      60 * 60 * 1000
    ); // Cache for 1 hour
  }

  // Get price history for a token
  async getTokenPriceHistory(
    symbol,
    period = '7d',
    currency = 'USD',
    interval = '1d'
  ) {
    const cacheKey = `history_${symbol}_${period}_${currency}_${interval}`;

    return this.getCachedData(
      cacheKey,
      async() => {
        try {
          const tokenId = await this.getTokenIdBySymbol(symbol);

          // Convert period to days
          const days = this.periodToDays(period);

          const response = await axios.get(
            `${this.coinGeckoBaseUrl}/coins/${tokenId}/market_chart`,
            {
              params: {
                vs_currency: currency.toLowerCase(),
                days: days,
                interval: interval === '1h' ? 'hourly' : 'daily'
              },
              timeout: 15000
            }
          );

          const prices = response.data.prices || [];

          return {
            symbol: symbol.toUpperCase(),
            currency: currency.toUpperCase(),
            period: period,
            interval: interval,
            data: prices.map(([timestamp, price]) => ({
              timestamp: new Date(timestamp).toISOString(),
              price: price
            })),
            source: 'CoinGecko'
          };
        } catch (error) {
          console.error(
            `Error fetching price history for ${symbol}:`,
            error.message
          );
          throw new Error(`Failed to fetch price history for ${symbol}`);
        }
      },
      5 * 60 * 1000
    ); // Cache for 5 minutes
  }

  // Get prices for multiple tokens
  async getBulkTokenPrices(symbols, currency = 'USD') {
    const cacheKey = `bulk_${symbols.join(',')}_${currency}`;

    return this.getCachedData(cacheKey, async() => {
      try {
        // Get token IDs for all symbols
        const tokenIds = await Promise.all(
          symbols.map((symbol) =>
            this.getTokenIdBySymbol(symbol).catch(() => null)
          )
        );

        const validTokenIds = tokenIds.filter((id) => id !== null);

        if (validTokenIds.length === 0) {
          throw new Error('No valid tokens found');
        }

        const response = await axios.get(
          `${this.coinGeckoBaseUrl}/simple/price`,
          {
            params: {
              ids: validTokenIds.join(','),
              vs_currencies: currency.toLowerCase(),
              include_market_cap: true,
              include_24hr_vol: true,
              include_24hr_change: true
            },
            timeout: 15000
          }
        );

        const result = {};

        for (let i = 0; i < symbols.length; i++) {
          const symbol = symbols[i];
          const tokenId = tokenIds[i];

          if (tokenId && response.data[tokenId]) {
            const priceData = response.data[tokenId];
            result[symbol] = {
              symbol: symbol.toUpperCase(),
              currency: currency.toUpperCase(),
              price: priceData[currency.toLowerCase()],
              market_cap: priceData[`${currency.toLowerCase()}_market_cap`],
              volume_24h: priceData[`${currency.toLowerCase()}_24h_vol`],
              change_24h: priceData[`${currency.toLowerCase()}_24h_change`]
            };
          } else {
            result[symbol] = {
              symbol: symbol.toUpperCase(),
              error: 'Token not found or price unavailable'
            };
          }
        }

        return result;
      } catch (error) {
        console.error('Error fetching bulk prices:', error.message);
        throw new Error('Failed to fetch bulk token prices');
      }
    });
  }

  // Get chart data for a token
  async getTokenChartData(
    symbol,
    period = '24h',
    currency = 'USD',
    points = 100
  ) {
    const cacheKey = `chart_${symbol}_${period}_${currency}_${points}`;

    return this.getCachedData(
      cacheKey,
      async() => {
        try {
          const tokenId = await this.getTokenIdBySymbol(symbol);
          const days = this.periodToDays(period);

          const response = await axios.get(
            `${this.coinGeckoBaseUrl}/coins/${tokenId}/market_chart`,
            {
              params: {
                vs_currency: currency.toLowerCase(),
                days: days
              },
              timeout: 15000
            }
          );

          const prices = response.data.prices || [];
          const volumes = response.data.total_volumes || [];

          // Sample data points if needed
          const sampledPrices = this.sampleData(prices, points);
          const sampledVolumes = this.sampleData(volumes, points);

          return {
            symbol: symbol.toUpperCase(),
            currency: currency.toUpperCase(),
            period: period,
            points: sampledPrices.length,
            prices: sampledPrices.map(([timestamp, price]) => ({
              timestamp: new Date(timestamp).toISOString(),
              price: price
            })),
            volumes: sampledVolumes.map(([timestamp, volume]) => ({
              timestamp: new Date(timestamp).toISOString(),
              volume: volume
            })),
            source: 'CoinGecko'
          };
        } catch (error) {
          console.error(
            `Error fetching chart data for ${symbol}:`,
            error.message
          );
          throw new Error(`Failed to fetch chart data for ${symbol}`);
        }
      },
      2 * 60 * 1000
    ); // Cache for 2 minutes
  }

  // Helper function to convert period string to days
  periodToDays(period) {
    const periodMap = {
      '1h': 1 / 24,
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };

    return periodMap[period] || 7;
  }

  // Helper function to sample data points
  sampleData(data, maxPoints) {
    if (data.length <= maxPoints) {
      return data;
    }

    const step = Math.floor(data.length / maxPoints);
    const sampled = [];

    for (let i = 0; i < data.length; i += step) {
      sampled.push(data[i]);
    }

    return sampled;
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

module.exports = new PriceService();
