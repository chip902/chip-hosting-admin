/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.{js,jsx,ts,tsx}',
    '**/*.(test|spec).{js,jsx,ts,tsx}',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'hooks/**/*.{js,ts}',
    'plugins/**/*.{js,ts}',
    'app/api/**/*.{js,ts}',
    'collections/**/*.{js,ts}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testTimeout: 30000,
  verbose: true,
  // Mock external dependencies that aren't needed for unit tests
  moduleNameMapping: {
    '^payload$': '<rootDir>/tests/__mocks__/payload.ts',
    '^next/server$': '<rootDir>/tests/__mocks__/next-server.ts',
  },
};

module.exports = config;