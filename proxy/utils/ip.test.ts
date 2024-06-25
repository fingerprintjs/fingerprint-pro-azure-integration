import { stripPort } from './ip'

describe('Strip port', () => {
  it('strip port from ipv4 address', () => {
    expect(stripPort('237.84.2.178:80')).toBe('237.84.2.178')
  })

  it('ipv6 without port', () => {
    expect(stripPort('5be8:dde9:7f0b:d5a7:bd01:b3be:9c69:573b')).toBe('5be8:dde9:7f0b:d5a7:bd01:b3be:9c69:573b')
  })

  it('ipv4 without port', () => {
    expect(stripPort('237.84.2.178')).toBe('237.84.2.178')
  })

  it('strip port from ipv6 address', () => {
    expect(stripPort('[2001:0db8:85a3:0000:0000:8a2e:0370:7334]:443')).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334')
  })

  it.each(['127.0', 'invalid', 'localhost', '2001:0db8:85a3:0000:0000'])('invalid ip: %s', (data) => {
    expect(stripPort(data)).toBe(data)
  })
})
