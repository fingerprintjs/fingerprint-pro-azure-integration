import { getOptions } from './fingerprint'
import { STATUS_PATH, StatusFormat, StatusInfo } from '../../shared/status'

export async function checkAzureStatus(options: ReturnType<typeof getOptions>) {
  const prefix = options.endpoint.split('/')[1]

  const url = new URL(location.origin)
  url.pathname = `/${prefix}/${STATUS_PATH}`
  url.searchParams.set('format', StatusFormat.JSON)

  const response = await fetch(url.toString())

  return (await response.json()) as StatusInfo
}
