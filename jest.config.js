/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '/functions/.+test.tsx?$',
  passWithNoTests: true,
  collectCoverageFrom: ['./functions/**/**.ts', '!**/index.ts'],
  coverageReporters: ['lcov', 'json-summary', ['text', { file: 'coverage.txt', path: './' }]],
}
