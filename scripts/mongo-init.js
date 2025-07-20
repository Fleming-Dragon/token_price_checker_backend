// Initialize the token_oracle database
db = db.getSiblingDB('token_oracle');

// Create collections with indexes
db.createCollection('tokens');
db.createCollection('tokenprices');

// Create indexes for better performance
db.tokens.createIndex({ symbol: 1 }, { unique: true });
db.tokens.createIndex({ contractAddress: 1 });
db.tokens.createIndex({ network: 1 });

db.tokenprices.createIndex({ token: 1, timestamp: 1 }, { unique: true });
db.tokenprices.createIndex({ token: 1, timestamp: -1 });
db.tokenprices.createIndex({ timestamp: 1 });
db.tokenprices.createIndex({ 'source.provider': 1 });

// Insert sample tokens
db.tokens.insertMany([
  {
    symbol: 'ETH',
    name: 'Ethereum',
    network: 'ethereum',
    contractAddress: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    metadata: {
      coingeckoId: 'ethereum',
      description: 'Ethereum native token'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    network: 'ethereum',
    contractAddress: '0xA0b86a33E6b7e1b0b95f2b3e4a9a1c4a7e7e7e7e',
    decimals: 6,
    metadata: {
      coingeckoId: 'usd-coin',
      description: 'USD Coin stablecoin'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    network: 'polygon',
    contractAddress: '0x0000000000000000000000000000000000001010',
    decimals: 18,
    metadata: {
      coingeckoId: 'matic-network',
      description: 'Polygon native token'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('Database initialized successfully with sample data');
