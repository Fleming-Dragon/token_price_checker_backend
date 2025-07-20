module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    'server.js',
    '!src/**/*.test.js',
    '!**/node_modules/**'
  ],
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  verbose: true
};
