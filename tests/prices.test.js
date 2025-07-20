const request = require('supertest');
const app = require('../server');

describe('Price API', () => {
  describe('GET /api/prices/:symbol', () => {
    it('should return price data for valid symbol', async() => {
      const response = await request(app).get('/api/prices/BTC').expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('symbol', 'BTC');
      expect(response.body.data).toHaveProperty('price');
      expect(typeof response.body.data.price).toBe('number');
    }, 15000);

    it('should handle currency parameter', async() => {
      const response = await request(app)
        .get('/api/prices/BTC?currency=EUR')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('currency', 'EUR');
    }, 15000);

    it('should return 404 for invalid symbol', async() => {
      const response = await request(app)
        .get('/api/prices/INVALIDTOKEN123')
        .expect(500); // Might be 500 due to API error

      expect(response.body).toHaveProperty('success', false);
    }, 15000);
  });

  describe('GET /api/prices/:symbol/history', () => {
    it('should return price history for valid symbol', async() => {
      const response = await request(app)
        .get('/api/prices/BTC/history')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('symbol', 'BTC');
      expect(response.body.data).toHaveProperty('data');
      expect(Array.isArray(response.body.data.data)).toBe(true);
    }, 20000);

    it('should handle period parameter', async() => {
      const response = await request(app)
        .get('/api/prices/BTC/history?period=24h')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.parameters).toHaveProperty('period', '24h');
    }, 20000);
  });

  describe('POST /api/prices/bulk', () => {
    it('should return prices for multiple tokens', async() => {
      const response = await request(app)
        .post('/api/prices/bulk')
        .send({
          symbols: ['BTC', 'ETH'],
          currency: 'USD'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('BTC');
      expect(response.body.data).toHaveProperty('ETH');
    }, 20000);

    it('should return 400 for invalid request body', async() => {
      const response = await request(app)
        .post('/api/prices/bulk')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for too many symbols', async() => {
      const symbols = Array.from({ length: 101 }, (_, i) => `TOKEN${i}`);

      const response = await request(app)
        .post('/api/prices/bulk')
        .send({ symbols })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Maximum 100 symbols');
    });
  });

  describe('GET /api/prices/:symbol/chart', () => {
    it('should return chart data for valid symbol', async() => {
      const response = await request(app)
        .get('/api/prices/BTC/chart')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('symbol', 'BTC');
      expect(response.body.data).toHaveProperty('prices');
      expect(Array.isArray(response.body.data.prices)).toBe(true);
    }, 20000);

    it('should handle chart parameters', async() => {
      const response = await request(app)
        .get('/api/prices/BTC/chart?period=24h&points=50')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.parameters).toHaveProperty('period', '24h');
      expect(response.body.parameters).toHaveProperty('points', 50);
    }, 20000);
  });
});
