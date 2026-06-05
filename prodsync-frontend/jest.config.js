const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const config = {
  setupFiles: ['<rootDir>/jest.env.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  preset: 'ts-jest', // Usar ts-jest
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', 'playwright.config.ts', 'global-setup.ts'],
  moduleNameMapper: {
    '\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(svg)$': '<rootDir>/__mocks__/svgMock.js',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/context/(.*)$': '<rootDir>/src/context/$1',
    '^@/icons/(.*)$': '<rootDir>/src/icons/$1',
    '^@/layout/(.*)$': '<rootDir>/src/layout/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest', // Transformar archivos ts y tsx con ts-jest
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill)/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
};

module.exports = createJestConfig(config);
