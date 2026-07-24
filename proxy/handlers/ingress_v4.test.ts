import proxyFn from '../index'
import * as ingress from './ingress'
import https, { Agent } from 'https'
import { ClientRequest, IncomingMessage } from 'http'
import { Socket } from 'net'
import { CustomerVariableName } from '../../shared/customer-variables/types'
import { EventEmitter } from 'events'
import { mockContext, mockRequestGet, mockRequestPost } from '../../shared/test/azure'
import { isTruthy } from '../../shared/assert'
import { Region } from '../utils/region'

describe('Ingress Endpoint V4', () => {
  let requestSpy: jest.MockInstance<ClientRequest, any>
  const mockSuccessfulResponse = ({
    checkRequestUrl,
    responseHeaders = {},
  }: {
    checkRequestUrl: (url: URL) => void
    responseHeaders?: Record<string, string>
  }) => {
    requestSpy.mockImplementationOnce((...args: any[]): any => {
      const [url, , callback] = args

      checkRequestUrl(new URL(url))

      const response = new EventEmitter()
      const request = new EventEmitter()

      Object.assign(response, {
        headers: responseHeaders,
        setEncoding: jest.fn(),
      })

      Object.assign(request, {
        end: jest.fn(),
        write: jest.fn(),
      })

      callback(response)

      setTimeout(() => {
        response.emit('data', Buffer.from('data', 'utf-8'))
        response.emit('end')
      }, 10)

      return request
    })
  }

  const getOrigin = (region?: string) =>
    isTruthy(region) ? `https://${region}.__ingress_api__` : 'https://__ingress_api__'
  const defaultOrigin: string = getOrigin()
  const search: string = '?ii=fingerprint-pro-azure%2F__azure_function_version__%2Fingress'
  const getSearchWithRegion = (region: string) => `?region=${region}&${search.replace('?', '')}`

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
    const req = mockRequestGet('https://fp.domain.com', 'fpjs')
    mockSuccessfulResponse({
      checkRequestUrl: (url) => {
        expect(url.pathname).toBe('/')
        expect(url.searchParams.get('ii')).toBe('fingerprint-pro-azure/__azure_function_version__/ingress')
      },
    })

    await proxyFn(req, mockContext())
    expect(ingress.handleIngress).toHaveBeenCalledTimes(1)
  })

  test('With proxy secret', async () => {
    Object.assign(process.env, {
      [CustomerVariableName.PreSharedSecret]: 'secret',
    })

    mockSuccessfulResponse({
      checkRequestUrl: (url) => {
        expect(url.toString()).toBe(`${defaultOrigin}/${search}`)
      },
    })

    const req = mockRequestPost('https://fp.domain.com', 'fpjs')

    await proxyFn(req, mockContext())

    const [, options] = requestSpy.mock.calls[0]

    expect(options.headers['fpjs-proxy-secret']).toBe('secret')
  })

  test('Cookies should include only _iidt', async () => {
    const req = mockRequestPost('https://fp.domain.com', 'fpjs')

    mockSuccessfulResponse({
      checkRequestUrl: (url) => {
        expect(url.toString()).toBe(`${defaultOrigin}/${search}`)
      },
    })

    await proxyFn(req, mockContext())

    const [, options] = requestSpy.mock.calls[0]
    expect(options.headers.cookie).toBe('_iidt=7A03Gwg')
  })

  test('Cookies are undefined if _iidt is not est', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs')

    req.headers.set('cookie', '_vid_t=gEFRuIQlzYmv692/UL4GLA==')

    mockSuccessfulResponse({
      checkRequestUrl: (url) => {
        expect(url.toString()).toBe(`${defaultOrigin}/${search}`)
      },
    })

    await proxyFn(req, mockContext())

    const [, options] = requestSpy.mock.calls[0]
    expect(options.headers.cookie).toBeFalsy()
  })

  test('Request body and headers are not modified, expect strict-transport-security and transfer-encoding', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs')
    const resHeaders = {
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'Retry-After',
      'content-type': 'text/plain',
      'strict-transport-security': 'max-age=31536000; includeSubDomains',
      'transfer-encoding': 'chunked',
    }

    mockSuccessfulResponse({
      checkRequestUrl: (url) => {
        expect(url.toString()).toBe(`${defaultOrigin}/`)
      },
      responseHeaders: resHeaders,
    })
    const ctx = mockContext()
    const res = await proxyFn(req, ctx)

    expect(await res.text()).toBe('data')
    expect(res.headers).toEqual(
      new Headers({
        'access-control-allow-credentials': 'true',
        'access-control-expose-headers': 'Retry-After',
        'content-type': 'text/plain',
      })
    )
  })

  test('Request body is not modified on error', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs')
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
        setEncoding: jest.fn(),
      })

      callback(emitter)

      emitter.emit('data', Buffer.from('error'))

      emitter.emit('end')
    })
    const ctx = mockContext()
    const res = await proxyFn(req, ctx)

    expect(await res.text()).toBe(resBody)
    expect(res.headers).toEqual(new Headers(resHeaders))
  })

  test('Returns error response on function error', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs')

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

    const ctx = mockContext()
    const res = await proxyFn(req, ctx)

    expect(await res.json()).toEqual({
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
    const req = mockRequestGet('https://fp.domain.com', 'fpjs')
    mockSuccessfulResponse({
      checkRequestUrl: (url) => {
        expect(url.toString()).toBe(`${defaultOrigin}/${search}`)
      },
    })

    await proxyFn(req, mockContext())
    expect(ingress.handleIngress).toHaveBeenCalledTimes(1)
    expect(https.request).toHaveBeenCalledWith(`${defaultOrigin}/`, expect.anything(), expect.anything())
    expect(https.request).toHaveBeenCalledTimes(1)
  })

  test('HTTP GET with suffix', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/with/suffix')
    mockSuccessfulResponse({
      checkRequestUrl: (url) => {
        expect(url.toString()).toBe(`${defaultOrigin}/with/suffix`)
      },
    })
    await proxyFn(req, mockContext())
    expect(ingress.handleIngress).toHaveBeenCalledTimes(1)
    expect(https.request).toHaveBeenCalledWith(`${defaultOrigin}/with/suffix`, expect.anything(), expect.anything())
    expect(https.request).toHaveBeenCalledTimes(1)
  })

  test('HTTP POST without suffix', async () => {
    const req = mockRequestPost('https://fp.domain.com', 'fpjs')
    mockSuccessfulResponse({
      checkRequestUrl: (url) => {
        expect(url.toString()).toBe(`${defaultOrigin}/${search}`)
      },
    })
    await proxyFn(req, mockContext())
    expect(ingress.handleIngress).toHaveBeenCalledTimes(1)
    expect(https.request).toHaveBeenCalledWith(`${defaultOrigin}/${search}`, expect.anything(), expect.anything())
    expect(https.request).toHaveBeenCalledTimes(1)
  })

  test('HTTP POST with suffix', async () => {
    const req = mockRequestPost('https://fp.domain.com', 'fpjs/with/suffix')
    mockSuccessfulResponse({
      checkRequestUrl: (url) => {
        expect(url.toString()).toBe(`${defaultOrigin}/with/suffix${search}`)
      },
    })
    await proxyFn(req, mockContext())
    expect(ingress.handleIngress).toHaveBeenCalledTimes(1)
    expect(https.request).toHaveBeenCalledWith(
      `${defaultOrigin}/with/suffix${search}`,
      expect.anything(),
      expect.anything()
    )
    expect(https.request).toHaveBeenCalledTimes(1)
  })

  test('HTTP POST with bad suffix', async () => {
    const req = mockRequestPost('https://fp.domain.com', 'fpjswith/bad/suffix')
    await proxyFn(req, mockContext())
    expect(ingress.handleIngress).toHaveBeenCalledTimes(1)
    expect(https.request).toHaveBeenCalledTimes(1)
  })

  test('Suffix with a dot', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/.suffix')

    mockSuccessfulResponse({
      checkRequestUrl: (url) => {
        expect(url.toString()).toEqual(`${defaultOrigin}/.suffix${search}`)
      },
    })

    const ctx = mockContext()

    await proxyFn(req, ctx)
  })

  Object.values(Region).forEach((region) => {
    test(`Suffix with a dot for region ${region}`, async () => {
      const req = mockRequestGet('https://fp.domain.com', 'fpjs/.suffix', {
        region,
      })

      mockSuccessfulResponse({
        checkRequestUrl: (url) => {
          const expectedQuery = getSearchWithRegion(region)

          if (region === Region.us) {
            expect(url.toString()).toEqual(`${defaultOrigin}/.suffix${expectedQuery}`)
          } else {
            expect(url.toString()).toEqual(`${getOrigin(region)}/.suffix${expectedQuery}`)
          }
        },
      })

      const ctx = mockContext()

      await proxyFn(req, ctx)
    })
  })

  test('Suffix with a dot for invalid region', async () => {
    const req = mockRequestGet('https://fp.domain.com', 'fpjs/.suffix', {
      region: 'invalid',
    })

    mockSuccessfulResponse({
      checkRequestUrl: (url) => {
        expect(url.toString()).toEqual(`${defaultOrigin}/.suffix${getSearchWithRegion('invalid')}`)
      },
    })

    const ctx = mockContext()

    await proxyFn(req, ctx)
  })

  test.each(['invalid', 'usa', 'EU', 'US', 'AP', '.invalid'])(
    'Should set default (US) region when invalid region is provided in query parameter: %s',
    async (region) => {
      const req = mockRequestGet('https://fp.domain.com', 'fpjs', {
        region,
      })

      mockSuccessfulResponse({
        checkRequestUrl: (url) => {
          expect(url.toString()).toBe(`${defaultOrigin}/${getSearchWithRegion(region)}`)
        },
      })

      const ctx = mockContext()

      await proxyFn(req, ctx)
    }
  )
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
    const req = mockRequestPost('https://fp.domain.com', 'fpjs/with/suffix')
    const context = mockContext()
    const res = await proxyFn(req, context)
    expect(res.headers.get('cache-control')).toBe(cacheControlValue)
  })
})
