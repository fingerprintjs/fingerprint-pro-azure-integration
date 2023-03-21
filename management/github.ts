import { config } from './config'
import { isSemverGreater } from './semver'
import { Logger } from '@azure/functions'

function bearer(token?: string) {
  return `Bearer ${token}`
}

export async function getLatestGithubRelease(token?: string) {
  const response = await fetch(
    `https://api.github.com/repos/${config.repositoryOwner}/${config.repository}/releases/latest`,
    {
      headers: {
        Authorization: bearer(token),
      },
    },
  )

  return await response.json()
}

export async function downloadReleaseAsset(url: string, token?: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: bearer(token),
    },
  })

  return Buffer.from(await response.arrayBuffer())
}

export async function findFunctionZip(assets: GithubReleaseAsset[]) {
  return assets.find(
    (asset) => asset.name.endsWith('.zip') && asset.state === 'uploaded' && asset.content_type === 'application/zip',
  )
}

export async function getLatestFunctionZip(logger?: Logger, token?: string) {
  const release = await getLatestGithubRelease(token)

  if (!isSemverGreater(release.tag_name, config.version)) {
    logger?.verbose(`Latest release ${release.tag_name} is not greater than current version ${config.version}`)

    return null
  }

  const asset = await findFunctionZip(release.assets)

  logger?.verbose(`Found asset ${asset?.name} for release ${release.tag_name}`, asset)

  return asset
    ? {
        file: await downloadReleaseAsset(asset.browser_download_url, token),
        name: asset.name,
      }
    : null
}

export interface GithubRelease {
  assets_url: string
  url: string
  tag_name: string
  name: string
  assets: GithubReleaseAsset[]
}

export interface GithubReleaseAsset {
  name: string
  content_type: string
  state: 'uploaded' | 'errored'
  browser_download_url: string
}
