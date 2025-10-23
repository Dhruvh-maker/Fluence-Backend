import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock external services
jest.mock('../services/social.service.js', () => ({
  postToSocialMedia: jest.fn(),
  getSocialMediaData: jest.fn()
}));

// Global test timeout
jest.setTimeout(10000);






