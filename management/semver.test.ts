import { isSemverGreater } from './semver'

describe('isSemverGreater', () => {
  it.each([
    {
      left: '1.0.0',
      right: '1.0.0',
      expected: false,
    },
    {
      left: '1.0.0',
      right: '1.0.1',
      expected: false,
    },
    {
      left: '1.0.1',
      right: '1.0.0',
      expected: true,
    },
    {
      left: '1.0.0',
      right: '1.1.0',
      expected: false,
    },
    {
      left: '1.1.0',
      right: '1.0.0',
      expected: true,
    },
    {
      left: '1.0.0',
      right: '2.0.0',
      expected: false,
    },
    {
      left: '2.0.0',
      right: '1.0.0',
      expected: true,
    },
    {
      left: 'v2.0.0',
      right: '1.0.0',
      expected: true,
    },
  ])('should return true if left version is greater than right one', (testCase) => {
    expect(isSemverGreater(testCase.left, testCase.right)).toBe(testCase.expected)
  })
})
