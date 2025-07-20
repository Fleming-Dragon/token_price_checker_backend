// Test setup file
process.env.NODE_ENV = 'test';

// Mock console.error to reduce noise in tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Only log errors that are not expected test errors
  if (!args[0] || !args[0].toString().includes('Error fetching')) {
    originalConsoleError(...args);
  }
};

// Global test timeout
jest.setTimeout(30000);
