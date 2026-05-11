import { config } from './config'
import { isSemverGreater } from './semver'
import { Logger } from '@azure/functions'
import { parse } from 'semver'

export function bearer(token?: string) {
  return `Bearer ${token}`
}

async function getLatestGithubReleaseWithPrelease(token?: string) {
  const response = await fetch(`https://api.github.com/repos/${config.repositoryOwner}/${config.repository}/releases`, {
    headers: token
      ? {
          Authorization: bearer(token),
        }
      : undefined,
  })

  const releases = (await response.json()) as GithubRelease[]

  return releases?.[0]
}

export async function getLatestGithubRelease(token?: string) {
  const response = await fetch(
    `https://api.github.com/repos/${config.repositoryOwner}/${config.repository}/releases/latest`,
    {
      headers: token
        ? {
            Authorization: bearer(token),
          }
        : undefined,
    }
  )

  return (await response.json()) as GithubRelease
}

export async function downloadReleaseAsset(url: string, token?: string, logger?: Logger) {
  logger?.verbose(`Downloading release asset from ${url}`)

  const headers: Record<string, string> = {
    Accept: 'application/octet-stream',
    'User-Agent': 'fingerprint-pro-azure-integration',
  }
  if (token) {
    headers['Authorization'] = bearer(token)
  }

  const response = await fetch(url, { headers })

  const arrayBuffer = await response.arrayBuffer()

  return Buffer.from(arrayBuffer)
}

export async function findFunctionZip(assets: GithubReleaseAsset[]) {
  return assets.find(
    (asset) => asset.name === 'package.zip' && asset.state === 'uploaded' && asset.content_type === 'application/zip'
  )
}

export async function getLatestFunctionZip(
  logger?: Logger,
  token?: string,
  version = config.version,
  allowPrerelease = false
) {
  if (allowPrerelease) {
    logger?.info('Pre-releases are allowed')
  }

  const release = allowPrerelease
    ? await getLatestGithubReleaseWithPrelease(token)
    : await getLatestGithubRelease(token)

  // Parse tag to include only version
  let tagName: string
  if (release.tag_name?.includes('@')) {
    // Example tag: @fingerprint/azure-frontdoor-proxy@1.6.0
    const split = release.tag_name.split('@')
    tagName = split[split.length - 1]
  } else {
    tagName = release?.tag_name
  }

  if (!isSemverGreater(tagName, version)) {
    logger?.verbose(`Latest release ${tagName} is not greater than current version ${version}`)

    return null
  }

  const releaseSemver = parse(tagName)
  const versionSemver = parse(version)

  if (releaseSemver?.major !== versionSemver?.major) {
    logger?.verbose("Major versions doesn't match, skipping")
    return null
  }

  logger?.verbose(`Found new release ${tagName}`, release.assets)

  const asset = await findFunctionZip(release.assets)

  logger?.verbose(`Found asset ${asset?.name} for release ${release.tag_name}`, asset)

  return asset
    ? {
        file: await downloadReleaseAsset(asset.url, token, logger),
        name: asset.name,
        version: tagName,
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
  url: string
  name: string
  content_type: string
  state: 'uploaded' | 'errored'
}
