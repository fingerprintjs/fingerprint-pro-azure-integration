import { getIntegrationVersion } from '../../shared/version.ts'

const PARAM_NAME = 'ii'

export function addTrafficMonitoringSearchParamsForIngressRequest(url: URL) {
  url.searchParams.append(PARAM_NAME, getTrafficMonitoringValue())
}

function getTrafficMonitoringValue() {
  return `fingerprint-pro-azure/${getIntegrationVersion()}/ingress`
}
