import { config } from './config'

export function getLatestGithubRelease() {
  return fetch(`https://api.github.com/repos/${config.repositoryOwner}/${config.repository}/releases/latest`).then(
    (response) => response.json(),
  )
}

export interface GithubRelease {
  assets_url: string
  url: string
  tag_name: string
  name: string
}
