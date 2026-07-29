import { getIntegrationVersion } from '../../shared/version.ts'

const PARAM_NAME = 'ii'

export async function addTrafficMonitoringSearchParamsForIngressRequest(url: URL) {
  url.searchParams.append(PARAM_NAME, await getTrafficMonitoringValue())
}

async function getTrafficMonitoringValue() {
  return `fingerprint-pro-azure/${await getIntegrationVersion()}/ingress`
}
