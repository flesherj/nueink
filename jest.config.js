module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'packages/**/repositories/**/*.ts',
    'packages/**/services/**/*.ts',
    '!packages/**/repositories/**/*.spec.ts',
    '!packages/**/repositories/**/*.test.ts',
    '!packages/**/repositories/__tests__/**',
    '!packages/**/services/**/*.spec.ts',
    '!packages/**/services/**/*.test.ts',
    '!packages/**/services/__tests__/**',
    '!packages/**/models/**/*.ts',
    '!packages/**/index.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@nueink/aws$': '<rootDir>/packages/aws/index.ts',
    '^@nueink/core$': '<rootDir>/packages/core/index.ts',
    '^@nueink/ui$': '<rootDir>/packages/ui/index.ts',
  },
};
