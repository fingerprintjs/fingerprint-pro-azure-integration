/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '/proxy/.+test.tsx?$',
  passWithNoTests: true,
  collectCoverageFrom: ['./functions/**/**.ts', '!**/index.ts'],
  coverageReporters: ['lcov', 'json-summary', ['text', { file: 'coverage.txt', path: './' }]],
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.test.json',
      },
    ],
  },
}
