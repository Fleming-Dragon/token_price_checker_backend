const request = require('supertest');
const app = require('../server');

describe('Server', () => {
  describe('GET /', () => {
    it('should return welcome message', async() => {
      const response = await request(app).get('/').expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain(
        'Welcome to Token Price Checker Backend API'
      );
    });
  });

  describe('GET /health', () => {
    it('should return health check', async() => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api', () => {
    it('should return API info', async() => {
      const response = await request(app).get('/api').expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('availableEndpoints');
    });
  });

  describe('404 handler', () => {
    it('should return 404 for non-existent routes', async() => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Route not found');
      expect(response.body).toHaveProperty('message');
    });
  });
});
