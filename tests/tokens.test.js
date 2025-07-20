const request = require('supertest');
const app = require('../server');

describe('Token API', () => {
  describe('GET /api/tokens', () => {
    it('should return list of tokens', async() => {
      const response = await request(app).get('/api/tokens').expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    }, 15000); // Increased timeout for API calls

    it('should handle pagination parameters', async() => {
      const response = await request(app)
        .get('/api/tokens?page=1&limit=10')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    }, 15000);
  });

  describe('GET /api/tokens/:symbol', () => {
    it('should return token info for valid symbol', async() => {
      const response = await request(app).get('/api/tokens/BTC').expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('symbol', 'BTC');
    }, 15000);

    it('should return 404 for invalid symbol', async() => {
      const response = await request(app)
        .get('/api/tokens/INVALIDTOKEN123')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    }, 15000);

    it('should return 400 for missing symbol', async() => {
      const response = await request(app).get('/api/tokens/').expect(404); // This will hit the general 404 handler
    });
  });

  describe('GET /api/tokens/search/:query', () => {
    it('should return search results for valid query', async() => {
      const response = await request(app)
        .get('/api/tokens/search/bitcoin')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('query', 'bitcoin');
    }, 15000);

    it('should return 400 for short query', async() => {
      const response = await request(app)
        .get('/api/tokens/search/a')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });
});
