const FUNCTION_VERSION = '__azure_function_version__'
const PARAM_NAME = 'ii'

export function addTrafficMonitoringSearchParamsForProCDN(url: URL) {
  url.searchParams.append(PARAM_NAME, getTrafficMonitoringValue('procdn'))
}

export function addTrafficMonitoringSearchParamsForVisitorIdRequest(url: URL) {
  url.searchParams.append(PARAM_NAME, getTrafficMonitoringValue('ingress'))
}

function getTrafficMonitoringValue(type: 'procdn' | 'ingress'): string {
  return `fingerprintjs-pro-azure/${FUNCTION_VERSION}/${type}`
}
