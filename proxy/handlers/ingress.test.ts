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
import https from 'https'

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

const mockRequest = (url: string, uri: string): HttpRequest => {
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
    bufferBody: Buffer.from(''),
  }
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
  const origin: string = 'https://__ingress_api__'
  const queryString: string = '?ii=fingerprint-pro-azure%2F__azure_function_version__%2Fingress'

  beforeAll(() => {
    jest.spyOn(ingress, 'handleIngress')
    jest.spyOn(https, 'request')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('Call without suffix', async () => {
    const req = mockRequest('https://fp.domain.com', 'fpjs/resultId')
    await proxy(mockContext(req), req)
    expect(ingress.handleIngress).toHaveBeenCalledTimes(1)
    expect(https.request).toHaveBeenCalledWith(
      new URL(`${origin}/${queryString}`),
      expect.anything(),
      expect.anything(),
    )
  }, 30000)

  test('Call with suffix', async () => {
    const req = mockRequest('https://fp.domain.com', 'fpjs/resultId/with/suffix')
    await proxy(mockContext(req), req)
    expect(ingress.handleIngress).toHaveBeenCalledTimes(1)
    expect(https.request).toHaveBeenCalledWith(
      new URL(`${origin}/with/suffix${queryString}`),
      expect.anything(),
      expect.anything(),
    )
  }, 30000)

  test('Call with bad suffix', async () => {
    const req = mockRequest('https://fp.domain.com', 'fpjs/resultIdwith/bad/suffix')
    await proxy(mockContext(req), req)
    expect(ingress.handleIngress).toHaveBeenCalledTimes(0)
    expect(https.request).toHaveBeenCalledTimes(0)
  }, 30000)
})