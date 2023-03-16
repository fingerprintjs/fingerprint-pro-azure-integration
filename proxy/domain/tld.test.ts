import { getEffectiveTLDPlusOne } from './tld'

describe('getEffectiveTLDPlusOne', () => {
  it('second-level domain', () => {
    expect(getEffectiveTLDPlusOne('fpjs.sh')).toBe('fpjs.sh')
  })

  it.each([
    {
      domain: 'test.fpjs.sh',
      expected: 'fpjs.sh',
    },
    {
      domain: 'fpjsproxyintegrationfd-fjdee0ceaccvdjax.z01.azurefd.net',
      expected: 'azurefd.net',
    },
  ])('third-level domain', ({ domain, expected }) => {
    expect(getEffectiveTLDPlusOne(domain)).toBe(expected)
  })
})
