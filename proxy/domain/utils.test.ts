import { getDomainFromHostname } from './utils'

describe('getDomainFromHostname', () => {
  it('second-level domain', () => {
    expect(getDomainFromHostname('fpjs.sh')).toBe('fpjs.sh')
  })

  it('third-level domain', () => {
    expect(getDomainFromHostname('test.fpjs.sh')).toBe('fpjs.sh')
  })
})
