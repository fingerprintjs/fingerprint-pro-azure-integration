import { STATUS_PATH, StatusFormat, StatusInfo } from '../../shared/status'

export async function checkAzureStatus(integrationPath: string) {
  const url = new URL(location.origin)
  url.pathname = `/${integrationPath}/${STATUS_PATH}`
  url.searchParams.set('format', StatusFormat.JSON)

  const response = await fetch(url.toString())

  return (await response.json()) as StatusInfo
}
