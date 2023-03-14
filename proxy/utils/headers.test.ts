import { HttpRequest } from '@azure/functions'
import { filterRequestHeaders, getHost, updateResponseHeaders } from './headers'
import { IncomingHttpHeaders } from 'http'

const mockReq: HttpRequest = {
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
    host: 'fpjs.sh',
    'transfer-encoding': 'br',
    via: 'azure.com',
    cookie: '_iidt=7A03Gwg; _vid_t=gEFRuIQlzYmv692/UL4GLA==',
    'x-custom-header': 'value123899',
    'x-edge-qqq': 'x-edge-qqq',
    'strict-transport-security': 'max-age=600',
  },
  user: null,
  params: {},
  get: jest.fn(),
  parseFormBody: jest.fn(),
}

describe('filterRequestHeaders', () => {
  test('test filtering blackilisted headers', () => {
    const headers = filterRequestHeaders(mockReq.headers)

    expect(headers.hasOwnProperty('content-length')).toBe(false)
    expect(headers.hasOwnProperty('host')).toBe(false)
    expect(headers.hasOwnProperty('transfer-encoding')).toBe(false)
    expect(headers.hasOwnProperty('via')).toBe(false)
    expect(headers['content-type']).toBe('application/json')
    expect(headers['cookie']).toBe('_iidt=7A03Gwg')
    expect(headers['x-custom-header']).toBe('value123899')
    expect(headers.hasOwnProperty('x-edge-qqq')).toBe(false)
    expect(headers.hasOwnProperty('strict-transport-security')).toBe(false)
  })
})

describe('updateResponseHeaders', () => {
  test('correctly updates response headers', () => {
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

    const resultHeaders = updateResponseHeaders(headers, 'fpjs.sh')

    expect(resultHeaders.hasOwnProperty('custom-header-1')).toBe(true)
    expect(resultHeaders.hasOwnProperty('content-length')).toBe(false)
    expect(resultHeaders.hasOwnProperty('x-edge-xxx')).toBe(false)
    expect(resultHeaders['cache-control']).toBe('public, max-age=3600, s-maxage=60')
    expect(resultHeaders['set-cookie']).toBe('_iidf; HttpOnly; Domain=fpjs.sh')
    expect(resultHeaders.hasOwnProperty('strict-transport-security')).toBe(false)
  })

  test('updates cache policy', () => {
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
      'set-cookie': ['_iidf', 'HttpOnly', 'Domain=cloudfront.net'],
      vary: 'Accept-Encoding',
      'custom-header-1': 'gdfddfd',
    }

    const resultHeaders = updateResponseHeaders(headers, 'fpjs.sh')

    expect(resultHeaders.hasOwnProperty('custom-header-1')).toBe(true)
    expect(resultHeaders.hasOwnProperty('content-length')).toBe(false)
    expect(resultHeaders['cache-control']).toBe('no-cache, max-age=3600, s-maxage=60')
    expect(resultHeaders['set-cookie']).toBe('_iidf; HttpOnly; Domain=fpjs.sh')
  })
})

describe('getHost', () => {
  it.each([
    [
      {
        headers: {
          'x-forwarded-host': 'fpjs.sh',
        },
      },
      'fpjs.sh',
    ],
    [
      {
        headers: {
          host: 'fpjs.sh',
        },
      },
      'fpjs.sh',
    ],
  ])('returns correct host', (request, expectedHost) => {
    expect(getHost(request)).toBe(expectedHost)
  })
})
