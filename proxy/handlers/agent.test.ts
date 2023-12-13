import https from 'https'
import proxy from '../index'
import { EventEmitter } from 'events'
import { mockContext, mockRequestGet } from '../../shared/test/azure'

describe('Agent Endpoint', () => {
  const origin: string = '__fpcdn__'

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
      headers: {},
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

  test('Call with no params', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/agent')
    const ctx = mockContext(req)

    await proxy(ctx, req)

    expect(requestSpy).toHaveBeenCalledTimes(0)

    expect(JSON.parse(ctx.res?.body)).toEqual({
      message: 'API Key is missing',
      path: 'fpjs/agent',
      vendor: 'Fingerprint Pro Azure Function',
    })
  })

  test('Call with version', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/agent', {
      apiKey: 'ujKG34hUYKLJKJ1F',
      version: '5',
    })
    const ctx = mockContext(req)

    await proxy(ctx, req)

    const [url] = requestSpy.mock.calls[0]

    expect(url.toString()).toEqual(
      `https://${origin}/v5/ujKG34hUYKLJKJ1F?ii=fingerprint-pro-azure%2F__azure_function_version__%2Fprocdn`,
    )
  })

  test('Call with version and loaderVersion', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/agent', {
      apiKey: 'ujKG34hUYKLJKJ1F',
      version: '5',
      loaderVersion: '3.6.5',
    })
    const ctx = mockContext(req)

    await proxy(ctx, req)

    const [url] = requestSpy.mock.calls[0]

    expect(url.toString()).toEqual(
      `https://${origin}/v5/ujKG34hUYKLJKJ1F/loader_v3.6.5.js?ii=fingerprint-pro-azure%2F__azure_function_version__%2Fprocdn`,
    )
  })

  test('invalid apiKey, version and loaderVersion', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/agent', {
      apiKey: 'foo.bar/baz',
      version: 'foo.bar1/baz',
      loaderVersion: 'foo.bar2/baz',
    })

    await proxy(mockContext(req), req)

    const [url] = requestSpy.mock.calls[0]

    expect(url.origin).toEqual(`https://${origin}`)
  })

  test('Browser cache set to an hour when original value is higher', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/agent', {
      apiKey: 'ujKG34hUYKLJKJ1F',
      version: '5',
      loaderVersion: '3.6.5',
    })

    Object.assign(mockHttpResponse.headers, {
      'cache-control': 'public, max-age=3613',
    })

    const ctx = mockContext(req)

    await proxy(ctx, req)

    expect(ctx.res?.headers).toEqual({
      'cache-control': 'public, max-age=3600, s-maxage=60',
    })
  })

  test('Browser cache is the same when original value is lower than an hour', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/agent', {
      apiKey: 'ujKG34hUYKLJKJ1F',
      version: '5',
      loaderVersion: '3.6.5',
    })

    Object.assign(mockHttpResponse.headers, {
      'cache-control': 'public, max-age=100',
    })

    const ctx = mockContext(req)

    await proxy(ctx, req)

    expect(ctx.res?.headers).toEqual({
      'cache-control': 'public, max-age=100, s-maxage=60',
    })
  })

  test('Proxy cache set to a minute when original value is higher', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/agent', {
      apiKey: 'ujKG34hUYKLJKJ1F',
      version: '5',
      loaderVersion: '3.6.5',
    })

    Object.assign(mockHttpResponse.headers, {
      'cache-control': 'public, max-age=3613, s-maxage=575500',
    })

    const ctx = mockContext(req)

    await proxy(ctx, req)

    expect(ctx.res?.headers).toEqual({
      'cache-control': 'public, max-age=3600, s-maxage=60',
    })
  })

  test('Proxy cache is the same when original value is lower than a minute', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/agent', {
      apiKey: 'ujKG34hUYKLJKJ1F',
      version: '5',
      loaderVersion: '3.6.5',
    })

    Object.assign(mockHttpResponse.headers, {
      'cache-control': 'public, max-age=3613, s-maxage=10',
    })

    const ctx = mockContext(req)

    await proxy(ctx, req)

    expect(ctx.res?.headers).toEqual({
      'cache-control': 'public, max-age=3600, s-maxage=10',
    })
  })

  test('Response headers are the same, but strict-transport-security is removed', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/agent', {
      apiKey: 'ujKG34hUYKLJKJ1F',
      version: '5',
      loaderVersion: '3.6.5',
    })

    Object.assign(mockHttpResponse.headers, {
      'content-type': 'text/javascript; charset=utf-8',
      'strict-transport-security': 'max-age=63072000',
      'some-header': 'some-value',
    })

    const ctx = mockContext(req)

    await proxy(ctx, req)

    expect(ctx.res?.headers).toEqual({
      'content-type': 'text/javascript; charset=utf-8',
      'some-header': 'some-value',
    })
  })

  test('Req body and headers are the same, expect cookies, which should include only _iidt cookie', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/agent', {
      apiKey: 'ujKG34hUYKLJKJ1F',
      version: '5',
      loaderVersion: '3.6.5',
    })

    req.headers = {
      cookie:
        '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==; auth_token=123456',
      'cache-control': 'no-cache',
      'content-type': 'text/javascript; charset=utf-8',
      'accept-language': 'en-US',
      'user-agent': 'Mozilla/5.0',
      'x-some-header': 'some value',
    } as any

    const ctx = mockContext(req)

    await proxy(ctx, req)

    const body = Buffer.from(ctx.res?.body as string, 'base64').toString('utf-8')
    const [, options] = requestSpy.mock.calls[0]

    expect(body).toEqual(agentScript)

    expect(options.headers).toEqual({
      ...req.headers,
      cookie: '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==',
    })
  })

  test('Req body for error', async () => {
    requestSpy.mockImplementation(() => {
      setTimeout(() => {
        mockHttpRequest.emit('error', new Error('Network error'))
      }, 1)

      return mockHttpRequest
    })

    const req = mockRequestGet('https://fp.domain.com', 'fpjs/agent', {
      apiKey: 'ujKG34hUYKLJKJ1F',
      version: '5',
      loaderVersion: '3.6.5',
    })

    const ctx = mockContext(req)

    await proxy(ctx, req)

    expect(ctx.res?.body).toEqual('error')
    expect(ctx.res?.status).toEqual(500)
  })
})
