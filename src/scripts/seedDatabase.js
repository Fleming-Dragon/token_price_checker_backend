const mongoose = require('mongoose');
const Token = require('../models/Token');
const TokenPrice = require('../models/TokenPrice');
const logger = require('../utils/logger');
require('dotenv').config();

// Sample token data
const sampleTokens = [
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    network: 'ethereum',
    decimals: 18,
    logoUrl:
      'https://tokens.1inch.io/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png',
    isActive: true
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xA0b86a33E6441C5bC8aB8c000000000000000000',
    network: 'ethereum',
    decimals: 6,
    logoUrl:
      'https://tokens.1inch.io/0xa0b86a33e6441c5bc8ab8c000000000000000000.png',
    isActive: true
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    network: 'ethereum',
    decimals: 18,
    logoUrl:
      'https://tokens.1inch.io/0x6b175474e89094c44da98b954eedeac495271d0f.png',
    isActive: true
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    address: '0x0000000000000000000000000000000000001010',
    network: 'polygon',
    decimals: 18,
    logoUrl:
      'https://tokens.1inch.io/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0.png',
    isActive: true
  }
];

// Generate sample price data
function generateSamplePrices(token, days = 30) {
  const prices = [];
  const now = Math.floor(Date.now() / 1000);
  const oneDaySeconds = 24 * 60 * 60;

  // Base prices for different tokens
  const basePrices = {
    WETH: 2000,
    USDC: 1,
    DAI: 1,
    MATIC: 0.8
  };

  const basePrice = basePrices[token.symbol] || 100;

  for (let i = days; i >= 0; i--) {
    const timestamp = now - i * oneDaySeconds;
    const date = new Date(timestamp * 1000);

    // Add some realistic price variation
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    const trendFactor = 1 + (Math.random() - 0.5) * 0.02; // Small trend
    const price = basePrice * (1 + variation) * trendFactor;

    prices.push({
      token: token.address,
      network: token.network,
      date: date,
      timestamp: timestamp,
      price: Number(price.toFixed(6)),
      priceUsd: Number(price.toFixed(6)),
      volume24h: Math.random() * 1000000,
      marketCap: price * (Math.random() * 1000000000),
      source: 'manual',
      confidence: 1
    });
  }

  return prices;
}

// Seed function
async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');

    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/token_oracle';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    // Clear existing data
    logger.info('Clearing existing data...');
    await Promise.all([Token.deleteMany({}), TokenPrice.deleteMany({})]);

    // Insert sample tokens
    logger.info('Inserting sample tokens...');
    const insertedTokens = await Token.insertMany(sampleTokens);
    logger.info(`Inserted ${insertedTokens.length} tokens`);

    // Generate and insert sample price data
    logger.info('Generating sample price data...');
    const allPrices = [];

    for (const token of insertedTokens) {
      const prices = generateSamplePrices(token, 30); // 30 days of data
      allPrices.push(...prices);
    }

    logger.info(`Generated ${allPrices.length} price records`);

    // Insert prices in batches
    const batchSize = 100;
    for (let i = 0; i < allPrices.length; i += batchSize) {
      const batch = allPrices.slice(i, i + batchSize);
      await TokenPrice.insertMany(batch);
      logger.info(
        `Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          allPrices.length / batchSize
        )}`
      );
    }

    // Create some interpolated price records
    logger.info('Creating interpolated price samples...');
    const interpolatedPrices = [];

    for (const token of insertedTokens) {
      const basePrice = await TokenPrice.findOne({
        token: token.address,
        network: token.network
      }).sort({ timestamp: -1 });

      if (basePrice) {
        // Create a few interpolated records
        for (let i = 1; i <= 3; i++) {
          const interpolatedTimestamp = basePrice.timestamp + i * 3600; // 1 hour intervals
          interpolatedPrices.push({
            token: token.address,
            network: token.network,
            date: new Date(interpolatedTimestamp * 1000),
            timestamp: interpolatedTimestamp,
            price: basePrice.price * (1 + (Math.random() - 0.5) * 0.01),
            priceUsd: basePrice.price * (1 + (Math.random() - 0.5) * 0.01),
            source: 'interpolated',
            confidence: 0.85
          });
        }
      }
    }

    if (interpolatedPrices.length > 0) {
      await TokenPrice.insertMany(interpolatedPrices);
      logger.info(
        `Inserted ${interpolatedPrices.length} interpolated price records`
      );
    }

    // Print summary
    const tokenCount = await Token.countDocuments();
    const priceCount = await TokenPrice.countDocuments();

    logger.info('Database seeding completed!');
    logger.info(`Summary:
      - Tokens: ${tokenCount}
      - Price Records: ${priceCount}
      - Networks: ${[...new Set(sampleTokens.map((t) => t.network))].join(
    ', '
  )}`);

    // Print sample queries
    logger.info('Sample API calls you can try:');
    logger.info('- GET /api/tokens');
    logger.info('- GET /api/prices/history?symbol=WETH&days=7');
    logger.info(
      '- POST /api/oracle/price {"token":"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2","network":"ethereum","timestamp":' +
        Math.floor(Date.now() / 1000) +
        '}'
    );
  } catch (error) {
    logger.error('Seeding failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase, sampleTokens };
