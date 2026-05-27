// Path used for CDN request in ingress
export const INGRESS_CDN_PATH = 'web'

/**
 * Constructs the endpoint URL for the agent based on the provided query parameters.
 *
 * @param {URLSearchParams} params - The query parameters containing information such as `apiKey`, `loaderVersion`, and `version`.
 *                                  - `apiKey`: The API key used to identify the agent (default is an empty string if not provided).
 *                                  - `loaderVersion`: The version of the loader, if provided, it is included in the endpoint path.
 *                                  - `version`: The API version to use; defaults to '3' if not specified.
 * @return {string} The constructed URL for the agent endpoint.
 */
export function getV3AgentPath(params: URLSearchParams): string {
  const apiKey = params.get('apiKey') ?? ''
  const loaderVersion = params.get('loaderVersion')
  const version = params.get('version') ?? '3'

  const lv: string = loaderVersion ? `/loader_v${loaderVersion}.js` : ''
  return `/v${version}/${apiKey}${lv}`
}

export function stripRoutePrefix(path: string, prefix: string) {
  return path.startsWith(prefix) ? path.slice(prefix.length) : path
}
