import {
  addTrafficMonitoringSearchParamsForProCDN,
  addTrafficMonitoringSearchParamsForVisitorIdRequest,
} from './traffic'

describe('test procdn call', () => {
  it('test', () => {
    const url = new URL('https://fpjs.sh/agent?smth')
    addTrafficMonitoringSearchParamsForProCDN(url)

    const param = url.searchParams.get('ii')
    expect(param).toBe('fingerprintjs-pro-azure/__lambda_func_version__/procdn')
  })
})

describe('test visitor call', () => {
  it('test', () => {
    const url = new URL('https://fpjs.sh/visitorId?smth')
    addTrafficMonitoringSearchParamsForVisitorIdRequest(url)

    const param = url.searchParams.get('ii')
    expect(param).toBe('fingerprintjs-pro-azure/__lambda_func_version__/ingress')
  })
})
