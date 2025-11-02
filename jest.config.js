/**
 * Jest Configuration for Bitcoin Wallet Extension
 *
 * This configuration sets up Jest for testing a Chrome Extension with:
 * - TypeScript support via ts-jest
 * - React Testing Library for component tests
 * - JSDOM environment for browser APIs
 * - Chrome Extension API mocks
 * - Coverage thresholds for critical code
 */

module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',

  // Use jsdom environment to simulate browser environment
  testEnvironment: 'jsdom',

  // Roots for test discovery
  roots: ['<rootDir>/src'],

  // Test file patterns - only match .test.ts(x) and .spec.ts(x) files
  testMatch: [
    '**/__tests__/**/*.test.ts?(x)',
    '**/?(*.)+(spec|test).ts?(x)'
  ],

  // Ignore setup and mock files
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/setup/',
    '/__tests__/__mocks__/'
  ],

  // Module name mapper for path aliases and assets
  moduleNameMapper: {
    // CSS imports (ignore in tests)
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__tests__/__mocks__/styleMock.js',

    // Image and asset imports (return filename)
    '\\.(jpg|jpeg|png|gif|svg|woff|woff2|ttf|eot)$': '<rootDir>/src/__tests__/__mocks__/fileMock.js',
  },

  // Setup files to run before tests
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup/setupTests.ts'
  ],

  // Setup files to run before environment is created
  setupFiles: [
    '<rootDir>/src/__tests__/setup/setupEnv.ts',
    'jest-canvas-mock'
  ],

  // Transform TypeScript and JavaScript files
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      }
    }]
  },

  // File extensions to consider
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/example*.ts',
    '!src/popup/index.tsx', // Entry point, hard to test
    '!src/background/index.ts' // Service worker, tested separately
  ],

  // Coverage thresholds (note: use coverageThreshold, not coverageThresholds)
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Critical security code requires 100% coverage
    './src/background/wallet/CryptoUtils.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    './src/background/wallet/KeyManager.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },

  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],

  // Test timeout (30 seconds)
  testTimeout: 30000,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Reset mocks between tests
  resetMocks: true,

  // Verbose output
  verbose: true,

  // Additional test environment options
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  }
};
