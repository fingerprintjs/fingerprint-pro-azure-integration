const FUNCTION_VERSION = '__azure_function_version__'
const PARAM_NAME = 'ii'

export function addTrafficMonitoringSearchParamsForIngressRequest(url: URL) {
  url.searchParams.append(PARAM_NAME, getTrafficMonitoringValue())
}

function getTrafficMonitoringValue(): string {
  return `fingerprint-pro-azure/${FUNCTION_VERSION}/ingress`
}
