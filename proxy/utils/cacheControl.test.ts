import { updateCacheControlHeader } from './cacheControl'

describe('updateCacheControlHeader', () => {
  it('adjust max-age to lower value', () => {
    expect(updateCacheControlHeader('public, max-age=36000, s-maxage=36000')).toBe('public, max-age=3600, s-maxage=60')
  })

  it('keep existing smaller value', () => {
    expect(updateCacheControlHeader('public, max-age=600, s-maxage=600')).toBe('public, max-age=600, s-maxage=60')
  })

  it('add max age if not exist', () => {
    expect(updateCacheControlHeader('no-cache')).toBe('no-cache, max-age=3600, s-maxage=60')
  })
})
