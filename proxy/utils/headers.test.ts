import { describe, expect, it } from 'vitest'
import {
  filterRequestHeaders,
  prepareHeadersForIngressAPI,
  updateResponseHeaders,
  updateResponseHeadersForAgentDownload,
} from './headers'
import { IncomingHttpHeaders } from 'http'
import { mockRequestGet } from '../../shared/test/azure'

const mockReq = mockRequestGet('https://example.org', '/fpjs/client', {
  apiKey: 'ujKG34hUYKLJKJ1F',
  version: '3',
  loaderVersion: '3.6.2',
})

const mockHeaders = {
  'content-type': 'application/json',
  'content-length': '24354',
  host: 'example.org',
  'transfer-encoding': 'br',
  via: 'azure.com',
  cookie: '_iidt=7A03Gwg; _vid_t=gEFRuIQlzYmv692/UL4GLA==',
  'x-custom-header': 'value123899',
  'x-edge-qqq': 'x-edge-qqq',
  'strict-transport-security': 'max-age=600',
  'x-azure-requestchain': 'hops=1',
  'x-azure-clientip': '46.204.4.119',
  'x-forwarded-for': '127.0.0.1:12345',
  'x-azure-socketip': '127.0.0.1:12345',
  'x-forwarded-host': 'fpjs.sh',
}

Object.entries(mockHeaders).forEach(([key, value]) => {
  mockReq.headers.set(key, value)
})

describe('filterRequestHeaders', () => {
  it('test filtering blackilisted headers', () => {
    const headers = new Headers(filterRequestHeaders(mockReq.headers))

    expect(headers.has('content-length')).toBe(true)
    expect(headers.has('host')).toBe(false)
    expect(headers.has('transfer-encoding')).toBe(true)
    expect(headers.has('via')).toBe(true)
    expect(headers.get('content-type')).toBe('application/json')
    expect(headers.get('cookie')).toBe('_iidt=7A03Gwg')
    expect(headers.get('x-custom-header')).toBe('value123899')
    expect(headers.has('x-edge-qqq')).toBe(false)
    expect(headers.has('strict-transport-security')).toBe(false)
    expect(headers.has('x-azure-requestchain')).toBe(false)
    expect(headers.has('x-azure-socketip')).toBe(false)
  })
})

describe('updateResponseHeaders', () => {
  it('correctly updates response headers', () => {
    const headers: IncomingHttpHeaders = {
      'access-control-allow-credentials': 'true',
      'access-control-allow-origin': 'true',
      'access-control-expose-headers': 'true',
      'cache-control': 'public, max-age=40000, s-maxage=40000',
      'content-encoding': 'br',
      'content-length': '73892',
      'content-type': 'application/json',
      'cross-origin-resource-policy': 'cross-origin',
      etag: 'dskjhfadsjk',
      'set-cookie': ['_iidf', 'HttpOnly', 'Domain=azure.net'],
      vary: 'Accept-Encoding',
      'custom-header-1': 'gdfddfd',
      'x-edge-xxx': 'ery8u',
      'strict-transport-security': 'max-age=1000',
    }

    const resultHeaders = new Headers(updateResponseHeaders(headers))

    expect(resultHeaders.has('custom-header-1')).toBe(true)
    expect(resultHeaders.has('content-length')).toBe(true)
    expect(resultHeaders.has('x-edge-xxx')).toBe(false)
    expect(resultHeaders.get('cache-control')).toBe('public, max-age=40000, s-maxage=40000')
    expect(resultHeaders.has('strict-transport-security')).toBe(false)
  })

  it('updates cache policy', () => {
    const headers: IncomingHttpHeaders = {
      'access-control-allow-credentials': 'true',
      'access-control-allow-origin': 'true',
      'access-control-expose-headers': 'true',
      'cache-control': 'no-cache',
      'content-encoding': 'br',
      'content-length': '73892',
      'content-type': 'application/json',
      'cross-origin-resource-policy': 'cross-origin',
      etag: 'dskjhfadsjk',
      'set-cookie': ['_iidf', 'HttpOnly', 'Domain=azure.net'],
      vary: 'Accept-Encoding',
      'custom-header-1': 'gdfddfd',
    }

    const resultHeaders = new Headers(updateResponseHeaders(headers))

    expect(resultHeaders.has('custom-header-1')).toBe(true)
    expect(resultHeaders.has('content-length')).toBe(true)
    expect(resultHeaders.get('cache-control')).toBe('no-cache')
  })
})

describe('updateResponseHeadersForAgentDownload', () => {
  it('correctly updates response headers', () => {
    const headers: IncomingHttpHeaders = {
      'access-control-allow-credentials': 'true',
      'access-control-allow-origin': 'true',
      'access-control-expose-headers': 'true',
      'cache-control': 'public, max-age=40000, s-maxage=40000',
      'content-encoding': 'br',
      'content-length': '73892',
      'content-type': 'application/json',
      'cross-origin-resource-policy': 'cross-origin',
      etag: 'dskjhfadsjk',
      'set-cookie': ['_iidf', 'HttpOnly', 'Domain=azure.net'],
      vary: 'Accept-Encoding',
      'custom-header-1': 'gdfddfd',
      'x-edge-xxx': 'ery8u',
      'strict-transport-security': 'max-age=1000',
    }

    const resultHeaders = new Headers(updateResponseHeadersForAgentDownload(headers))

    expect(resultHeaders.has('custom-header-1')).toBe(true)
    expect(resultHeaders.has('content-length')).toBe(true)
    expect(resultHeaders.has('x-edge-xxx')).toBe(false)
    expect(resultHeaders.get('cache-control')).toBe('public, max-age=3600, s-maxage=60')
    expect(resultHeaders.has('strict-transport-security')).toBe(false)
  })

  it('updates cache policy', () => {
    const headers: IncomingHttpHeaders = {
      'access-control-allow-credentials': 'true',
      'access-control-allow-origin': 'true',
      'access-control-expose-headers': 'true',
      'cache-control': 'no-cache',
      'content-encoding': 'br',
      'content-length': '73892',
      'content-type': 'application/json',
      'cross-origin-resource-policy': 'cross-origin',
      etag: 'dskjhfadsjk',
      'set-cookie': ['_iidf', 'HttpOnly', 'Domain=azure.net'],
      vary: 'Accept-Encoding',
      'custom-header-1': 'gdfddfd',
    }

    const resultHeaders = new Headers(updateResponseHeadersForAgentDownload(headers))

    expect(resultHeaders.has('custom-header-1')).toBe(true)
    expect(resultHeaders.has('content-length')).toBe(true)
    expect(resultHeaders.get('cache-control')).toBe('no-cache, max-age=3600, s-maxage=60')
  })
})

describe('prepareHeadersForIngressAPI', () => {
  it('should set all proxy headers if proxy secret is defined, preserving the original headers', () => {
    const result = prepareHeadersForIngressAPI({
      request: mockReq,
      isAuthorizedMethodCall: true,
      preSharedSecret: 'secret',
    })

    expect(result['fpjs-proxy-client-ip']).toBe('127.0.0.1')
    expect(result['fpjs-proxy-secret']).toBe('secret')
    expect(result['fpjs-proxy-forwarded-host']).toBe('fpjs.sh')
    expect(result['x-custom-header']).toBe(mockReq.headers.get('x-custom-header'))
  })

  it('should set the other proxy headers, even if proxy secret is not defined, preserving the original headers', () => {
    const result = prepareHeadersForIngressAPI({
      request: mockReq,
      isAuthorizedMethodCall: true,
      preSharedSecret: undefined,
    })

    expect(result['fpjs-proxy-client-ip']).toBe('127.0.0.1')
    expect(result['fpjs-proxy-forwarded-host']).toBe('fpjs.sh')
    expect(result['fpjs-proxy-secret']).toBe(undefined)
    expect(result['x-custom-header']).toBe(mockReq.headers.get('x-custom-header'))
  })
})
