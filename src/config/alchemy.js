const { Alchemy, Network } = require('alchemy-sdk');

class AlchemyConnection {
  constructor() {
    this.ethereumClient = null;
    this.polygonClient = null;
    this.isConfigured = false;
  }

  initialize() {
    if (this.isConfigured) {
      console.log('🔗 Alchemy already configured');
      return;
    }

    const apiKey = process.env.ALCHEMY_API_KEY;

    if (!apiKey) {
      console.warn(
        '⚠️ Alchemy API key not provided. Some features may not work.'
      );
      return;
    }

    try {
      // Ethereum mainnet configuration
      const ethereumConfig = {
        apiKey: apiKey,
        network: Network.ETH_MAINNET,
        maxRetries: 3
      };

      // Polygon mainnet configuration
      const polygonConfig = {
        apiKey: apiKey,
        network: Network.MATIC_MAINNET,
        maxRetries: 3
      };

      this.ethereumClient = new Alchemy(ethereumConfig);
      this.polygonClient = new Alchemy(polygonConfig);

      this.isConfigured = true;
      console.log('🎯 Alchemy SDK configured successfully');
    } catch (error) {
      console.error('❌ Alchemy configuration failed:', error);
      throw error;
    }
  }

  getClient(network) {
    if (!this.isConfigured) {
      throw new Error('Alchemy not configured. Please check your API key.');
    }

    switch (network.toLowerCase()) {
    case 'ethereum':
    case 'eth':
      return this.ethereumClient;
    case 'polygon':
    case 'matic':
      return this.polygonClient;
    default:
      throw new Error(`Unsupported network: ${network}`);
    }
  }

  getEthereumClient() {
    return this.getClient('ethereum');
  }

  getPolygonClient() {
    return this.getClient('polygon');
  }

  getSupportedNetworks() {
    return ['ethereum', 'polygon'];
  }

  getConnectionStatus() {
    return {
      isConfigured: this.isConfigured,
      hasEthereumClient: !!this.ethereumClient,
      hasPolygonClient: !!this.polygonClient,
      supportedNetworks: this.getSupportedNetworks()
    };
  }

  // Helper method to validate network
  isNetworkSupported(network) {
    return this.getSupportedNetworks().includes(network.toLowerCase());
  }

  // Method to get token metadata
  async getTokenMetadata(tokenAddress, network) {
    try {
      const client = this.getClient(network);
      const metadata = await client.core.getTokenMetadata(tokenAddress);

      return {
        name: metadata.name,
        symbol: metadata.symbol,
        decimals: metadata.decimals,
        logo: metadata.logo
      };
    } catch (error) {
      console.error(
        `Error fetching token metadata for ${tokenAddress} on ${network}:`,
        error
      );
      throw error;
    }
  }

  // Method to get token balances
  async getTokenBalances(address, network) {
    try {
      const client = this.getClient(network);
      const balances = await client.core.getTokenBalances(address);

      return balances.tokenBalances;
    } catch (error) {
      console.error(
        `Error fetching token balances for ${address} on ${network}:`,
        error
      );
      throw error;
    }
  }

  // Method to get historical token prices (if available)
  async getHistoricalTokenPrice(tokenAddress, network, timestamp) {
    try {
      const client = this.getClient(network);

      // Note: Alchemy doesn't provide direct historical price data
      // This would typically require integration with a price oracle or DEX data
      console.warn(
        'Historical price data requires additional oracle integration'
      );

      // Placeholder for future implementation
      return null;
    } catch (error) {
      console.error(
        `Error fetching historical price for ${tokenAddress}:`,
        error
      );
      throw error;
    }
  }

  // Method to get token transfers
  async getTokenTransfers(
    tokenAddress,
    network,
    fromBlock = 'earliest',
    toBlock = 'latest'
  ) {
    try {
      const client = this.getClient(network);

      const transfers = await client.core.getAssetTransfers({
        fromBlock: fromBlock,
        toBlock: toBlock,
        contractAddresses: [tokenAddress],
        category: ['erc20'],
        withMetadata: true
      });

      return transfers.transfers;
    } catch (error) {
      console.error(
        `Error fetching token transfers for ${tokenAddress}:`,
        error
      );
      throw error;
    }
  }

  // Method to get first transaction timestamp (token creation)
  async getTokenCreationTimestamp(tokenAddress, network) {
    try {
      const client = this.getClient(network);

      // Get the earliest transactions for this token
      const transfers = await client.core.getAssetTransfers({
        fromBlock: 'earliest',
        contractAddresses: [tokenAddress],
        category: ['erc20'],
        maxCount: 1,
        order: 'asc'
      });

      if (transfers.transfers && transfers.transfers.length > 0) {
        const firstTransfer = transfers.transfers[0];
        const block = await client.core.getBlock(firstTransfer.blockNum);
        return block.timestamp;
      }

      return null;
    } catch (error) {
      console.error(
        `Error fetching token creation timestamp for ${tokenAddress}:`,
        error
      );
      throw error;
    }
  }
}

module.exports = new AlchemyConnection();
