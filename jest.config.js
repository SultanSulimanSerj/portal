/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'api',
      testMatch: ['<rootDir>/apps/api/**/*.spec.ts'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/apps/api/test/setup.ts'],
    },
    {
      displayName: 'shared',
      testMatch: ['<rootDir>/packages/shared/**/*.spec.ts'],
      testEnvironment: 'node',
    },
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'apps/**/*.ts',
    'packages/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
};