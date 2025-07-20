# Historical Token Price Oracle Backend

A comprehensive Node.js backend system for retrieving, storing, and serving historical token price data with advanced interpolation capabilities and real-time oracle functionality.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client API    │    │   Web Portal    │    │   Monitoring    │
│   Requests      │    │   Dashboard     │    │   & Alerts      │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
          ┌─────────────────────────────────────────────┐
          │           Express.js API Server             │
          │  ┌─────────────┐  ┌─────────────────────────┐│
          │  │   Oracle    │  │      Standard API       ││
          │  │  Endpoints  │  │    (Prices, Tokens)     ││
          │  └─────────────┘  └─────────────────────────┘│
          └─────────────────┬───────────────────────────┘
                            │
          ┌─────────────────┼───────────────────────────┐
          │                 │                           │
┌─────────▼───────┐ ┌───────▼────────┐ ┌─────────▼──────┐
│  Redis Cache    │ │   MongoDB      │ │   BullMQ       │
│   - Price Data  │ │  - Historical  │ │  - Job Queue   │
│   - Session     │ │    Prices      │ │  - Workers     │
│   - Rate Limit  │ │  - Token Info  │ │  - Scheduling  │
└─────────────────┘ └────────────────┘ └────────────────┘
          │                 │                   │
          └─────────────────┼───────────────────┘
                            │
          ┌─────────────────▼───────────────────┐
          │        Background Workers           │
          │  ┌─────────────┐ ┌─────────────────┐│
          │  │Price Fetcher│ │  Interpolation  ││
          │  │   Worker    │ │    Engine       ││
          │  └─────────────┘ └─────────────────┘│
          └─────────────────────────────────────┘
                            │
          ┌─────────────────▼───────────────────┐
          │        External APIs                │
          │  ┌─────────────┐ ┌─────────────────┐│
          │  │  Alchemy    │ │   CoinGecko     ││
          │  │     SDK     │ │      API        ││
          │  └─────────────┘ └─────────────────┘│
          └─────────────────────────────────────┘
```

## 🚀 Key Features

### Oracle System

- **Historical Price Retrieval**: Fetch token prices for any timestamp
- **Smart Interpolation**: Advanced algorithms to estimate prices for missing data points
- **Multi-Network Support**: Ethereum, Polygon, and more
- **Confidence Scoring**: Quality metrics for interpolated data
- **Background Processing**: Automated historical data collection

### Data Management

- **Redis Caching**: High-performance price data caching with TTL
- **MongoDB Storage**: Optimized schemas for time-series price data
- **Bulk Operations**: Efficient batch processing for historical data
- **Data Integrity**: Comprehensive validation and error handling

### API Features

- **RESTful Design**: Clean, intuitive API endpoints
- **Rate Limiting**: Configurable request throttling
- **Input Validation**: Comprehensive request validation using Joi
- **Error Handling**: Detailed error responses and structured logging
- **Health Monitoring**: Comprehensive service monitoring endpoints

## 📋 Prerequisites

- **Node.js**: >= 18.0.0
- **MongoDB**: >= 5.0
- **Redis**: >= 6.0
- **Alchemy API Key**: For blockchain data access

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Code Linting

```bash
# Check for linting errors
npm run lint

# Fix linting errors automatically
npm run lint:fix
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Health Check

```http
GET /health
```

### Endpoints

#### 🪙 Tokens

**Get All Tokens**

```http
GET /api/tokens?page=1&limit=100&sort=market_cap_desc
```

**Get Token by Symbol**

```http
GET /api/tokens/BTC
```

**Search Tokens**

```http
GET /api/tokens/search/bitcoin?limit=10
```

#### 💰 Prices

**Get Token Price**

```http
GET /api/prices/BTC?currency=USD
```

**Get Price History**

```http
GET /api/prices/BTC/history?period=7d&currency=USD&interval=1d
```

**Get Bulk Prices**

```http
POST /api/prices/bulk
Content-Type: application/json

{
  "symbols": ["BTC", "ETH", "ADA"],
  "currency": "USD"
}
```

**Get Chart Data**

```http
GET /api/prices/BTC/chart?period=24h&currency=USD&points=100
```

### Response Format

All API responses follow this format:

**Success Response:**

```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

## 🏗️ Project Structure

```
token_price_checker_backend/
├── src/
│   ├── controllers/          # Route controllers
│   │   ├── tokenController.js
│   │   └── priceController.js
│   ├── services/            # Business logic
│   │   ├── tokenService.js
│   │   └── priceService.js
│   ├── routes/              # API routes
│   │   ├── index.js
│   │   ├── tokens.js
│   │   └── prices.js
│   └── middleware/          # Custom middleware
│       └── validation.js
├── tests/                   # Test files
│   ├── server.test.js
│   ├── tokens.test.js
│   ├── prices.test.js
│   └── setup.js
├── server.js               # Main server file
├── package.json
├── .env                    # Environment variables
├── .gitignore
├── .eslintrc.js           # ESLint configuration
├── jest.config.js         # Jest configuration
└── README.md
```

## 🔧 Configuration

### Environment Variables

| Variable                | Description           | Default                 |
| ----------------------- | --------------------- | ----------------------- |
| `NODE_ENV`              | Environment mode      | `development`           |
| `PORT`                  | Server port           | `3000`                  |
| `FRONTEND_URL`          | Frontend URL for CORS | `http://localhost:3001` |
| `COINMARKETCAP_API_KEY` | CoinMarketCap API key | -                       |
| `COINGECKO_API_KEY`     | CoinGecko API key     | -                       |
| `BINANCE_API_KEY`       | Binance API key       | -                       |
| `BINANCE_SECRET_KEY`    | Binance secret key    | -                       |

### Supported Currencies

- USD, EUR, BTC, ETH, GBP, JPY, CAD, AUD

### Supported Time Periods

- `1h` - 1 hour
- `24h` - 24 hours
- `7d` - 7 days
- `30d` - 30 days
- `90d` - 90 days
- `1y` - 1 year

## 🛡️ Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configurable CORS settings
- **Helmet.js**: Security headers
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses

## 📊 Data Sources

- **Primary**: CoinGecko API (free tier)
- **Fallback**: Binance API
- **Optional**: CoinMarketCap API (with API key)

## 🚀 Deployment

### Docker (Coming Soon)

```dockerfile
# Dockerfile will be added for containerized deployment
```

### Environment-specific Configurations

**Development**

- Detailed error messages
- Development logging
- No caching for debugging

**Production**

- Optimized caching
- Error logging
- Performance monitoring

## 🧪 Testing

The project includes comprehensive tests:

- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **Error Handling Tests**: Error scenario validation

Run specific test suites:

```bash
# Test server functionality
npm test -- server.test.js

# Test token endpoints
npm test -- tokens.test.js

# Test price endpoints
npm test -- prices.test.js
```

## 📈 Performance

- **Caching**: Smart caching with configurable TTL
- **Rate Limiting**: Prevents API abuse
- **Fallback APIs**: Multiple data sources for reliability
- **Optimized Queries**: Efficient API calls and data processing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the API documentation
- Review the test files for usage examples

## 🔮 Future Enhancements

- [ ] WebSocket support for real-time price updates
- [ ] Database integration for historical data storage
- [ ] User authentication and API key management
- [ ] Advanced charting data with technical indicators
- [ ] Portfolio tracking capabilities
- [ ] Price alerts and notifications
- [ ] Docker containerization
- [ ] Kubernetes deployment configurations
- [ ] API documentation with Swagger/OpenAPI
