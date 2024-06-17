/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { HttpRequestQuery } from '@azure/functions/types/http'

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
export const mockRequestGet = (url: string, uri: string, query: HttpRequestQuery = {}) => {
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
      'x-client-ip': '128.0.0.1',
      'x-azure-socketip': '127.0.0.1',
    },
    query,
    params: {
      restOfPath: uri,
    },
    user: null,
    get: (x) => x,
    parseFormBody: () => form,
  } satisfies HttpRequest
}
export const mockRequestPost = (url: string, uri: string) => {
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
      'x-client-ip': '128.0.0.1',
      'x-azure-socketip': '127.0.0.1',
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
export const mockContext = (req: HttpRequest): Context => {
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
