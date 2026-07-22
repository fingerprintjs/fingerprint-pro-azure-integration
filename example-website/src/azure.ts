import { STATUS_PATH, StatusFormat, StatusInfo } from '../../shared/status.ts'

export async function checkAzureStatus(integrationPath: string) {
  const url = new URL(location.origin)
  url.pathname = `/${integrationPath}/${STATUS_PATH}`
  url.searchParams.set('format', StatusFormat.JSON)

  const response = await fetch(url.toString())

  // `Response.json()` is untyped (returns `any`), so we assert the parsed shape here.
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return (await response.json()) as StatusInfo
}
