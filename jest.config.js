/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '/proxy/.+test.tsx?$|/management/.+test.tsx?$',
  passWithNoTests: true,
  collectCoverageFrom: [
    './proxy/**/**.ts',
    './management/**/**.ts',
    './proxy/handlers/status.ts',
    '!**/index.ts',
    '!**/config.ts',
    '!**/env.ts',
    '!**/handlers/**',
    '!**/peoxy/app.ts',
    '!**/management/app.ts',
  ],
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
