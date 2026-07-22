import { describe, expect, it } from 'vitest'
import { addTrafficMonitoringSearchParamsForIngressRequest } from './traffic.ts'

describe('Traffic monitoring', () => {
  it('ingress request', () => {
    const url = new URL('https://fpjs.sh/visitorId?smth')
    addTrafficMonitoringSearchParamsForIngressRequest(url)

    const param = url.searchParams.get('ii')
    expect(param).toBe('fingerprint-pro-azure/__azure_function_version__/ingress')
  })
})
