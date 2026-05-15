import https from 'https'
import proxyFn from '../index'
import { EventEmitter } from 'events'
import { mockContext, mockRequestGet } from '../../shared/test/azure'
import { generateErrorResponse } from '../utils/errorResponse'

describe('Agent Endpoint V4', () => {
  const origin: string = '__ingress_api__'

  const agentScript =
    '/** FingerprintJS Pro - Copyright (c) FingerprintJS, Inc, 2022 (https://fingerprint.com) /** function hi() { console.log("hello world!!") }'

  let requestSpy: jest.SpyInstance

  const setEncoding = jest.fn()

  let mockHttpResponse: EventEmitter & {
    setEncoding: jest.Mock
    headers: any
    statusCode: number
  }
  let mockHttpRequest: EventEmitter

  beforeEach(() => {
    requestSpy = jest.spyOn(https, 'request')

    mockHttpResponse = new EventEmitter() as any
    mockHttpRequest = new EventEmitter()

    Object.assign(mockHttpRequest, {
      end: jest.fn(),
    })
    Object.assign(mockHttpResponse, {
      setEncoding,
      headers: {
        'content-type': 'text/javascript; charset=utf-8',
      },
      statusCode: 200,
    })

    requestSpy.mockImplementation((_url: any, _options: any, callback): any => {
      callback(mockHttpResponse)

      mockHttpResponse.emit('data', Buffer.from(agentScript).toString('binary'))
      mockHttpResponse.emit('end')

      return mockHttpRequest
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('Call with all params', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/web/v4/ujKG34hUYKLJKJ1F')
    const ctx = mockContext()

    await proxyFn(req, ctx)

    const [url] = requestSpy.mock.calls[0]

    expect(url.toString()).toEqual(`https://${origin}/web/v4/ujKG34hUYKLJKJ1F`)
  })

  test('Browser cache set to an hour when original value is higher', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/web/v4/ujKG34hUYKLJKJ1F')

    Object.assign(mockHttpResponse.headers, {
      'cache-control': 'public, max-age=3613',
    })

    const ctx = mockContext()

    const res = await proxyFn(req, ctx)

    expect(res.headers).toEqual(
      new Headers({
        'cache-control': 'public, max-age=3600, s-maxage=60',
        'content-type': 'text/javascript; charset=utf-8',
      })
    )
  })

  test('Browser cache is the same when original value is lower than an hour', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/web/v4/ujKG34hUYKLJKJ1F')

    Object.assign(mockHttpResponse.headers, {
      'cache-control': 'public, max-age=100',
    })

    const ctx = mockContext()

    const res = await proxyFn(req, ctx)

    expect(res.headers).toEqual(
      new Headers({
        'cache-control': 'public, max-age=100, s-maxage=60',
        'content-type': 'text/javascript; charset=utf-8',
      })
    )
  })

  test('Proxy cache set to a minute when original value is higher', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/web/v4/ujKG34hUYKLJKJ1F')

    Object.assign(mockHttpResponse.headers, {
      'cache-control': 'public, max-age=3613, s-maxage=575500',
    })

    const ctx = mockContext()

    const res = await proxyFn(req, ctx)

    expect(res.headers).toEqual(
      new Headers({
        'cache-control': 'public, max-age=3600, s-maxage=60',
        'content-type': 'text/javascript; charset=utf-8',
      })
    )
  })

  test('Proxy cache is the same when original value is lower than a minute', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/web/v4/ujKG34hUYKLJKJ1F')

    Object.assign(mockHttpResponse.headers, {
      'cache-control': 'public, max-age=3613, s-maxage=10',
    })

    const ctx = mockContext()

    const res = await proxyFn(req, ctx)

    expect(res.headers).toEqual(
      new Headers({
        'cache-control': 'public, max-age=3600, s-maxage=10',
        'content-type': 'text/javascript; charset=utf-8',
      })
    )
  })

  test('Response headers are the same, but strict-transport-security is removed', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/web/v4/ujKG34hUYKLJKJ1F')

    Object.assign(mockHttpResponse.headers, {
      'content-type': 'text/javascript; charset=utf-8',
      'strict-transport-security': 'max-age=63072000',
      'some-header': 'some-value',
    })

    const ctx = mockContext()

    const res = await proxyFn(req, ctx)

    expect(res.headers).toEqual(
      new Headers({
        'content-type': 'text/javascript; charset=utf-8',
        'some-header': 'some-value',
      })
    )
  })

  test('Req body and headers are the same, expect cookies, which should be omitted', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/web/v4/ujKG34hUYKLJKJ1F')

    Array.from(req.headers.keys()).forEach((key) => req.headers.delete(key))

    req.headers.set(
      'cookie',
      '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==; auth_token=123456'
    )
    req.headers.set('cache-control', 'no-cache')
    req.headers.set('content-type', 'text/javascript; charset=utf-8')
    req.headers.set('accept-language', 'en-US')
    req.headers.set('user-agent', 'Mozilla/5.0')
    req.headers.set('x-some-header', 'some value')

    const ctx = mockContext()

    const res = await proxyFn(req, ctx)

    const body = await res.text()
    const [, options] = requestSpy.mock.calls[0]

    expect(body).toEqual(agentScript)

    const reqHeadersDict = Object.fromEntries(req.headers.entries())

    expect(options.headers).toEqual({
      ...reqHeadersDict,
      cookie: undefined,
    })
  })

  test('Req body for error', async () => {
    requestSpy.mockImplementation(() => {
      setTimeout(() => {
        mockHttpRequest.emit('error', new Error('Network error'))
      }, 1)

      return mockHttpRequest
    })

    const req = mockRequestGet('https://fp.domain.com', 'fpjs/web/v4/ujKG34hUYKLJKJ1F')

    const ctx = mockContext()

    const res = await proxyFn(req, ctx)

    expect(await res.json()).toEqual({
      ...generateErrorResponse(new Error('Network error')),
      requestId: expect.any(String),
    })
    expect(res.status).toEqual(500)
  })
})
