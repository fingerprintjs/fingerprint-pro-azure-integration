import {
  BindingDefinition,
  Context,
  ContextBindingData,
  ExecutionContext,
  Form,
  FormPart,
  HttpRequest,
  Logger,
  TraceContext,
} from '@azure/functions'
import proxy from '../index'
import * as ingress from './ingress'
import https, { Agent } from 'https'
import { ClientRequest, IncomingMessage } from 'http'
import { Socket } from 'net'
import { CustomerVariableType } from '../../shared/customer-variables/types'
import { EventEmitter } from 'events'

const fp: FormPart = {
  value: Buffer.from(''),
}
const form: Form = {
  get: (_: string) => fp,
  getAll: (_: string) => [fp],
  has: (_: string) => true,
  length: 0,
  *[Symbol.iterator]() {},
}

const mockRequestGet = (url: string, uri: string) => {
  return {
    method: 'GET',
    url: url, // 'https://fp.domain.com'
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
      'x-azure-requestchain': 'hops=1',
      'x-azure-socketip': '46.204.4.119',
      'x-forwarded-for': '127.0.0.1',
    },
    query: {},
    params: {
      restOfPath: uri,
    },
    user: null,
    get: (x) => x,
    parseFormBody: () => form,
  } satisfies HttpRequest
}

const mockRequestPost = (url: string, uri: string) => {
  return {
    method: 'POST',
    url: url, // 'https://fp.domain.com'
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
      'x-azure-requestchain': 'hops=1',
      'x-azure-socketip': '46.204.4.119',
      'x-forwarded-for': '127.0.0.1',
    },
    query: {},
    params: {
      restOfPath: uri,
    },
    user: null,
    get: (x) => x,
    parseFormBody: () => form,
    bufferBody: Buffer.from(''),
  } satisfies HttpRequest
}

const mockContext = (req: HttpRequest): Context => {
  const unk = undefined as unknown
  const loggerUnknown = {
    verbose: () => null,
    warn: () => null,
    error: () => null,
  } as unknown
  const trace = unk as TraceContext
  const logger = loggerUnknown as Logger
  const execution = unk as ExecutionContext
  const bindings = unk as BindingDefinition
  const contextBinding = unk as ContextBindingData
  return {
    bindingData: contextBinding,
    bindingDefinitions: [],
    bindings: bindings,
    executionContext: execution,
    invocationId: '',
    traceContext: trace,
    done(_?: Error | string | null, __?: any): void {},
    log: logger,
    req,
  }
}

describe('Result Endpoint', function () {
  let requestSpy: jest.MockInstance<ClientRequest, any>
  const origin: string = 'https://__ingress_api__'
  const search: string = '?ii=fingerprint-pro-azure%2F__azure_function_version__%2Fingress'

  beforeAll(() => {
    jest.spyOn(ingress, 'handleIngress')
    requestSpy = jest.spyOn(https, 'request')
  })

  beforeEach(() => {
    requestSpy.mockReset()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('Traffic monitoring', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/resultId')
    requestSpy.mockImplementationOnce((...args) => {
      const [url, options] = args
      expect(url.toString()).toBe(`${origin}/${search}`)
      options.agent = new Agent()
      return Reflect.construct(ClientRequest, args)
    })
    await proxy(mockContext(req), req)
    expect(ingress.handleIngress).toHaveBeenCalledTimes(1)
    expect(https.request).toHaveBeenCalledTimes(1)

    const [url] = requestSpy.mock.calls[0]
    expect(url.searchParams.get('ii')).toBe('fingerprint-pro-azure/__azure_function_version__/ingress')
  })

  test('With proxy secret', async () => {
    Object.assign(process.env, {
      [CustomerVariableType.PreSharedSecret]: 'secret',
    })

    const req = mockRequestGet('https://fp.domain.com', 'fpjs/resultId')
    requestSpy.mockImplementationOnce((...args) => {
      const [url, options] = args
      expect(url.toString()).toBe(`${origin}/${search}`)
      options.agent = new Agent()
      return Reflect.construct(ClientRequest, args)
    })
    await proxy(mockContext(req), req)

    const [, options] = requestSpy.mock.calls[0]

    expect(options.headers['fpjs-proxy-secret']).toBe('secret')
  })

  test('Cookies should include only _iidt', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/resultId')
    requestSpy.mockImplementationOnce((...args) => {
      const [url, options] = args
      expect(url.toString()).toBe(`${origin}/${search}`)
      options.agent = new Agent()
      return Reflect.construct(ClientRequest, args)
    })
    await proxy(mockContext(req), req)

    const [, options] = requestSpy.mock.calls[0]
    expect(options.headers.cookie).toBe('_iidt=7A03Gwg')
  })

  test('Cookies are first party for the req url whose TLD has exception, the domain is derived from the req url (not origin header)', async () => {
    requestSpy.mockImplementation((_url: any, _options: any, callback): any => {
      const emitter = new EventEmitter()

      Object.assign(emitter, {
        statusCode: 200,
        headers: {
          'set-cookie': [
            '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==; Path=/; Domain=fpjs.io; Expires=Fri, 19 Jan 2024 08:54:36 GMT; HttpOnly; Secure; SameSite=None, anotherCookie=anotherValue; Domain=fpjs.io;',
          ],
          origin: ['https://some-other.com'],
        },
      })

      callback(emitter)

      emitter.emit('data', Buffer.from('data'))

      emitter.emit('end')
    })

    const req = mockRequestGet('https://fp.domain.com', 'fpjs/resultId')

    req.headers.host = 'city.kawasaki.jp'

    const ctx = mockContext(req)

    await proxy(ctx, req)

    expect(ctx.res?.headers).toEqual({
      'set-cookie':
        '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==; Path=/; Domain=city.kawasaki.jp; Expires=Fri, 19 Jan 2024 08:54:36 GMT; HttpOnly; Secure; SameSite=None, anotherCookie=anotherValue; Domain=city.kawasaki.jp;',
      origin: 'https://some-other.com',
    })
  })

  test('Cookies are first party for the req url whose TLD has wildcard, the domain is derived from the req url (not origin header)', async () => {
    requestSpy.mockImplementation((_url: any, _options: any, callback): any => {
      const emitter = new EventEmitter()

      Object.assign(emitter, {
        statusCode: 200,
        headers: {
          'set-cookie': [
            '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==; Path=/; Domain=fpjs.io; Expires=Fri, 19 Jan 2024 08:54:36 GMT; HttpOnly; Secure; SameSite=None, anotherCookie=anotherValue; Domain=fpjs.io;',
          ],
          origin: ['https://some-other.com'],
        },
      })

      callback(emitter)

      emitter.emit('data', Buffer.from('data'))

      emitter.emit('end')
    })

    const req = mockRequestGet('https://fp.domain.com', 'fpjs/resultId')

    req.headers.host = 'sub2.sub1.some.alces.network'

    const ctx = mockContext(req)

    await proxy(ctx, req)

    expect(ctx.res?.headers).toEqual({
      'set-cookie':
        '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==; Path=/; Domain=sub1.some.alces.network; Expires=Fri, 19 Jan 2024 08:54:36 GMT; HttpOnly; Secure; SameSite=None, anotherCookie=anotherValue; Domain=sub1.some.alces.network;',
      origin: 'https://some-other.com',
    })
  })

  test('Request body and headers are not modified, expect strict-transport-security and transfer-encoding', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/resultId')
    const resHeaders = {
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'Retry-After',
      'content-type': 'text/plain',
      'strict-transport-security': 'max-age=31536000; includeSubDomains',
      'transfer-encoding': 'chunked',
    }

    const resBody = 'data'
    requestSpy.mockImplementationOnce((...args: any[]): any => {
      const [url, , callback] = args
      expect(url.toString()).toBe(`${origin}/${search}`)

      const response = new EventEmitter()
      const request = new EventEmitter()

      Object.assign(request, {
        end: jest.fn(),
        write: jest.fn(),
      })

      Object.assign(response, {
        headers: resHeaders,
      })

      callback(response)

      setTimeout(() => {
        response.emit('data', Buffer.from(resBody, 'utf-8'))
        response.emit('end')
      }, 10)

      return request
    })
    const ctx = mockContext(req)
    await proxy(ctx, req)

    expect(ctx.res?.body.toString()).toBe(resBody)
    expect(ctx.res?.headers).toEqual({
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'Retry-After',
      'content-type': 'text/plain',
    })
  })

  test('Request body is not modified on error', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/resultId')
    const resHeaders = {
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'Retry-After',
      'content-type': 'text/plain',
    }

    const resBody = 'error'
    requestSpy.mockImplementation((_url: any, _options: any, callback): any => {
      const emitter = new EventEmitter()

      Object.assign(emitter, {
        statusCode: 500,
        headers: resHeaders,
      })

      callback(emitter)

      emitter.emit('data', Buffer.from('error'))

      emitter.emit('end')
    })
    const ctx = mockContext(req)
    await proxy(ctx, req)

    expect(ctx.res?.body.toString()).toBe(resBody)
    expect(ctx.res?.headers).toEqual(resHeaders)
  })

  test('Returns error response on function error', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/resultId')

    requestSpy.mockImplementation((): any => {
      const emitter = new EventEmitter()

      Object.assign(emitter, {
        write: jest.fn(),
        end: jest.fn(),
      })

      setTimeout(() => {
        emitter.emit('error', new Error('Request timeout'))
      }, 1)

      return emitter
    })

    const ctx = mockContext(req)
    await proxy(ctx, req)

    expect(JSON.parse(ctx.res?.body)).toEqual({
      error: {
        code: 'Failed',
        message: 'An error occured with Fingerprint Pro Azure function. Reason: Request timeout',
      },
      products: {},
      requestId: expect.any(String),
      v: '2',
    })
  })

  test('HTTP GET without suffix', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/resultId')
    requestSpy.mockImplementationOnce((...args) => {
      const [url, options] = args
      expect(url.toString()).toBe(`${origin}/${search}`)
      options.agent = new Agent()
      return Reflect.construct(ClientRequest, args)
    })
    await proxy(mockContext(req), req)
    expect(ingress.handleIngress).toHaveBeenCalledTimes(1)
    expect(https.request).toHaveBeenCalledWith(
      expect.objectContaining({
        origin,
        pathname: '/',
        search,
      }),
      expect.anything(),
      expect.anything(),
    )
    expect(https.request).toHaveBeenCalledTimes(1)
  })

  test('HTTP GET with suffix', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/resultId/with/suffix')
    requestSpy.mockImplementationOnce((...args) => {
      const [url, options] = args
      expect(url.toString()).toBe(`${origin}/with/suffix${search}`)
      options.agent = new Agent()
      return Reflect.construct(ClientRequest, args)
    })
    await proxy(mockContext(req), req)
    expect(ingress.handleIngress).toHaveBeenCalledTimes(1)
    expect(https.request).toHaveBeenCalledWith(
      expect.objectContaining({
        origin,
        pathname: '/with/suffix',
        search,
      }),
      expect.anything(),
      expect.anything(),
    )
    expect(https.request).toHaveBeenCalledTimes(1)
  })

  test('HTTP GET with bad suffix', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/resultIdwith/bad/suffix')
    await proxy(mockContext(req), req)
    expect(ingress.handleIngress).toHaveBeenCalledTimes(0)
    expect(https.request).toHaveBeenCalledTimes(0)
  })

  test('HTTP POST without suffix', async () => {
    const req = mockRequestPost('https://fp.domain.com', 'fpjs/resultId')
    requestSpy.mockImplementationOnce((...args) => {
      const [url, options] = args
      expect(url.toString()).toBe(`${origin}/${search}`)
      options.agent = new Agent()
      return Reflect.construct(ClientRequest, args)
    })
    await proxy(mockContext(req), req)
    expect(ingress.handleIngress).toHaveBeenCalledTimes(1)
    expect(https.request).toHaveBeenCalledWith(
      expect.objectContaining({
        origin,
        pathname: '/',
        search,
      }),
      expect.anything(),
      expect.anything(),
    )
    expect(https.request).toHaveBeenCalledTimes(1)
  })

  test('HTTP POST with suffix', async () => {
    const req = mockRequestPost('https://fp.domain.com', 'fpjs/resultId/with/suffix')
    requestSpy.mockImplementationOnce((...args) => {
      const [url, options] = args
      expect(url.toString()).toBe(`${origin}/with/suffix${search}`)
      options.agent = new Agent()
      return Reflect.construct(ClientRequest, args)
    })
    await proxy(mockContext(req), req)
    expect(ingress.handleIngress).toHaveBeenCalledTimes(1)
    expect(https.request).toHaveBeenCalledWith(
      expect.objectContaining({
        origin,
        pathname: '/with/suffix',
        search,
      }),
      expect.anything(),
      expect.anything(),
    )
    expect(https.request).toHaveBeenCalledTimes(1)
  })

  test('HTTP POST with bad suffix', async () => {
    const req = mockRequestPost('https://fp.domain.com', 'fpjs/resultIdwith/bad/suffix')
    await proxy(mockContext(req), req)
    expect(ingress.handleIngress).toHaveBeenCalledTimes(0)
    expect(https.request).toHaveBeenCalledTimes(0)
  })
})

describe('Browser caching endpoint', () => {
  let requestSpy: jest.MockInstance<ClientRequest, any>

  beforeAll(() => {
    requestSpy = jest.spyOn(https, 'request')
  })

  afterAll(() => {
    requestSpy.mockRestore()
  })

  test('cache-control header is returned as is', async () => {
    const cacheControlValue = 'max-age=31536000, immutable, private'
    requestSpy.mockImplementationOnce((...args) => {
      const [, options, cb] = args
      options.agent = new Agent()
      const responseStream = new IncomingMessage(new Socket())
      cb(responseStream)
      responseStream.headers['cache-control'] = cacheControlValue
      responseStream.emit('end')
      return Reflect.construct(ClientRequest, args)
    })
    const req = mockRequestPost('https://fp.domain.com', 'fpjs/resultId/with/suffix')
    const context = mockContext(req)
    await proxy(context, req)
    expect(context.res?.headers?.['cache-control']).toBe(cacheControlValue)
  })
})
