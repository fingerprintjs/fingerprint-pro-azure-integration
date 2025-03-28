import { HttpRequest } from '@azure/functions'
import {
  filterRequestHeaders,
  prepareHeadersForIngressAPI,
  updateResponseHeaders,
  updateResponseHeadersForAgentDownload,
} from './headers'
import { IncomingHttpHeaders } from 'http'

const mockReq = {
  method: 'GET',
  url: 'https://example.org/fpjs/client',
  query: {
    apiKey: 'ujKG34hUYKLJKJ1F',
    version: '3',
    loaderVersion: '3.6.2',
  },
  headers: {
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
  },
  user: null,
  params: {},
  get: jest.fn(),
  parseFormBody: jest.fn(),
} satisfies HttpRequest

describe('filterRequestHeaders', () => {
  it('test filtering blackilisted headers', () => {
    const headers = filterRequestHeaders(mockReq.headers)

    expect(headers.hasOwnProperty('content-length')).toBe(true)
    expect(headers.hasOwnProperty('host')).toBe(false)
    expect(headers.hasOwnProperty('transfer-encoding')).toBe(true)
    expect(headers.hasOwnProperty('via')).toBe(true)
    expect(headers['content-type']).toBe('application/json')
    expect(headers['cookie']).toBe('_iidt=7A03Gwg')
    expect(headers['x-custom-header']).toBe('value123899')
    expect(headers.hasOwnProperty('x-edge-qqq')).toBe(false)
    expect(headers.hasOwnProperty('strict-transport-security')).toBe(false)
    expect(headers.hasOwnProperty('x-azure-requestchain')).toBe(false)
    expect(headers.hasOwnProperty('x-azure-socketip')).toBe(false)
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

    const resultHeaders = updateResponseHeaders(headers)

    expect(resultHeaders.hasOwnProperty('custom-header-1')).toBe(true)
    expect(resultHeaders.hasOwnProperty('content-length')).toBe(true)
    expect(resultHeaders.hasOwnProperty('x-edge-xxx')).toBe(false)
    expect(resultHeaders['cache-control']).toBe('public, max-age=40000, s-maxage=40000')
    expect(resultHeaders.hasOwnProperty('strict-transport-security')).toBe(false)
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

    const resultHeaders = updateResponseHeaders(headers)

    expect(resultHeaders.hasOwnProperty('custom-header-1')).toBe(true)
    expect(resultHeaders.hasOwnProperty('content-length')).toBe(true)
    expect(resultHeaders['cache-control']).toBe('no-cache')
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

    const resultHeaders = updateResponseHeadersForAgentDownload(headers)

    expect(resultHeaders.hasOwnProperty('custom-header-1')).toBe(true)
    expect(resultHeaders.hasOwnProperty('content-length')).toBe(true)
    expect(resultHeaders.hasOwnProperty('x-edge-xxx')).toBe(false)
    expect(resultHeaders['cache-control']).toBe('public, max-age=3600, s-maxage=60')
    expect(resultHeaders.hasOwnProperty('strict-transport-security')).toBe(false)
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

    const resultHeaders = updateResponseHeadersForAgentDownload(headers)

    expect(resultHeaders.hasOwnProperty('custom-header-1')).toBe(true)
    expect(resultHeaders.hasOwnProperty('content-length')).toBe(true)
    expect(resultHeaders['cache-control']).toBe('no-cache, max-age=3600, s-maxage=60')
  })
})

describe('prepareHeadersForIngressAPI', () => {
  it('should set all proxy headers if proxy secret is defined, preserving the original headers', () => {
    const result = prepareHeadersForIngressAPI(mockReq, 'secret')

    expect(result['fpjs-proxy-client-ip']).toBe('127.0.0.1')
    expect(result['fpjs-proxy-secret']).toBe('secret')
    expect(result['fpjs-proxy-forwarded-host']).toBe('fpjs.sh')
    expect(result['x-custom-header']).toBe(mockReq.headers['x-custom-header'])
  })

  it('should set the other proxy headers, even if proxy secret is not defined, preserving the original headers', () => {
    const result = prepareHeadersForIngressAPI(mockReq, undefined)

    expect(result['fpjs-proxy-client-ip']).toBe('127.0.0.1')
    expect(result['fpjs-proxy-forwarded-host']).toBe('fpjs.sh')
    expect(result['fpjs-proxy-secret']).toBe(undefined)
    expect(result['x-custom-header']).toBe(mockReq.headers['x-custom-header'])
  })
})
