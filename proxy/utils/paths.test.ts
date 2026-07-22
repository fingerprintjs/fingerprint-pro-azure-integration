import { describe, expect, it } from 'vitest'
import { getV3AgentPath, INGRESS_CDN_PATH, stripRoutePrefix } from './paths.ts'

describe('INGRESS_CDN_PATH', () => {
  it('is set to "web"', () => {
    expect(INGRESS_CDN_PATH).toBe('web')
  })
})

describe('getV3AgentPath', () => {
  it('returns path with apiKey and default version when only apiKey is provided', () => {
    const params = new URLSearchParams({ apiKey: 'test-key' })
    expect(getV3AgentPath(params)).toBe('/v3/test-key')
  })

  it('uses provided version when version is set', () => {
    const params = new URLSearchParams({ apiKey: 'test-key', version: '4' })
    expect(getV3AgentPath(params)).toBe('/v4/test-key')
  })

  it('includes loader version when provided', () => {
    const params = new URLSearchParams({ apiKey: 'test-key', loaderVersion: '3.6.0' })
    expect(getV3AgentPath(params)).toBe('/v3/test-key/loader_v3.6.0.js')
  })

  it('includes both version and loader version when provided', () => {
    const params = new URLSearchParams({
      apiKey: 'test-key',
      version: '4',
      loaderVersion: '4.0.0',
    })
    expect(getV3AgentPath(params)).toBe('/v4/test-key/loader_v4.0.0.js')
  })

  it('defaults apiKey to empty string when not provided', () => {
    const params = new URLSearchParams()
    expect(getV3AgentPath(params)).toBe('/v3/')
  })

  it('defaults to version 3 when version param is missing', () => {
    const params = new URLSearchParams({ apiKey: 'abc' })
    expect(getV3AgentPath(params)).toBe('/v3/abc')
  })

  it('does not include loader path when loaderVersion is empty string', () => {
    const params = new URLSearchParams({ apiKey: 'abc', loaderVersion: '' })
    expect(getV3AgentPath(params)).toBe('/v3/abc')
  })
})

describe('stripRoutePrefix', () => {
  it('removes the prefix from the beginning of the path', () => {
    expect(stripRoutePrefix('/api/foo/bar', '/api')).toBe('/foo/bar')
  })

  it('only removes the prefix at the start, not in the middle', () => {
    expect(stripRoutePrefix('/foo/api/bar', '/api')).toBe('/foo/api/bar')
  })

  it('returns the same path when prefix is not present', () => {
    expect(stripRoutePrefix('/foo/bar', '/api')).toBe('/foo/bar')
  })

  it('returns empty string when path equals prefix', () => {
    expect(stripRoutePrefix('/api', '/api')).toBe('')
  })

  it('handles empty path', () => {
    expect(stripRoutePrefix('', '/api')).toBe('')
  })

  it('handles empty prefix by returning the path unchanged', () => {
    expect(stripRoutePrefix('/foo/bar', '')).toBe('/foo/bar')
  })

  it('only removes the first occurrence of the prefix', () => {
    expect(stripRoutePrefix('/api/api/foo', '/api')).toBe('/api/foo')
  })
})
