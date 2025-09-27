// Jest setup for comment system tests
import { jest } from '@jest/globals';
import { beforeEach, afterEach } from 'node:test';
// Mock environment variables
process.env.RECAPTCHA_SECRET_KEY = 'test_secret_key';
process.env.RECAPTCHA_THRESHOLD = '0.7';
process.env.RATE_LIMIT_WINDOW = '3600000';
process.env.RATE_LIMIT_MAX_COMMENTS = '10';

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock Date.now for consistent testing
const mockDate = new Date('2024-01-01T00:00:00.000Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
Date.now = jest.fn(() => mockDate.getTime());

// Setup and teardown
beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Clean up after each test
  jest.clearAllTimers();
});

// Global mock implementations
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock reCAPTCHA global if needed
(global as any).grecaptcha = {
  execute: jest.fn().mockResolvedValue("mocked_recaptcha_token" as never),
  ready: jest.fn((callback: () => void) => callback()),
};