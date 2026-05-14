const FUNCTION_VERSION = '__azure_function_version__'
const PARAM_NAME = 'ii'

export function addTrafficMonitoringSearchParamsForIngressRequest(url: URL) {
  url.searchParams.append(PARAM_NAME, getTrafficMonitoringValue('ingress'))
}

function getTrafficMonitoringValue(type: 'procdn' | 'ingress'): string {
  return `fingerprint-pro-azure/${FUNCTION_VERSION}/${type}`
}
