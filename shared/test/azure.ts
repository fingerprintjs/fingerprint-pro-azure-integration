/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpRequest, InvocationContext } from '@azure/functions'

export const mockRequestGet = (url: string, uri: string, query: Record<string, string> = {}) => {
  return new HttpRequest({
    method: 'GET',
    url, // 'https://fp.domain.com'
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
      'x-azure-clientip': '46.204.4.119',
      'x-forwarded-for': '127.0.0.1',
      'x-client-ip': '128.0.0.1',
      'x-azure-socketip': '127.0.0.1',
    },
    query,
    params: {
      restOfPath: uri,
    },
  })
}
export const mockRequestPost = (url: string, uri: string) => {
  return new HttpRequest({
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
      'x-azure-clientip': '46.204.4.119',
      'x-forwarded-for': '127.0.0.1',
      'x-client-ip': '128.0.0.1',
      'x-azure-socketip': '127.0.0.1',
    },
    query: {},
    params: {
      restOfPath: uri,
    },
  })
}
export const mockContext = (): InvocationContext => {
  return {
    extraInputs: undefined as any,
    extraOutputs: undefined as any,
    functionName: '',
    invocationId: '',
    options: undefined as any,
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    trace: jest.fn(),
    log: jest.fn(),
  }
}
