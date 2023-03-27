import { config } from './config'
import { isSemverGreater } from './semver'
import { Logger } from '@azure/functions'
import * as https from 'https'

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

  return (await response.json()) as GithubRelease
}

export async function downloadReleaseAsset(url: string, token?: string, logger?: Logger) {
  logger?.verbose(`Downloading release asset from ${url}`)

  return new Promise<Buffer>((resolve, reject) => {
    const handleError = (error: Error) => {
      logger?.error('Unable to download release asset', { error })

      reject(error)
    }

    const request = https.request(
      url,
      {
        headers: {
          Authorization: bearer(token),
          Accept: 'application/octet-stream',
          'User-Agent': 'fingerprint-pro-azure-integration',
        },
        method: 'GET',
      },
      (response) => {
        // TODO For now, the request causes redirect, We need to check it again once repository is public
        if (response.statusCode === 302) {
          const downloadUrl = response.headers.location

          if (!downloadUrl) {
            reject(new Error('Unable to find download url'))

            return
          }

          const downloadRequest = https.get(downloadUrl, (downloadResponse) => {
            const chunks: any[] = []

            downloadResponse.on('data', (chunk) => {
              chunks.push(chunk)
            })

            downloadResponse.on('end', () => {
              resolve(Buffer.concat(chunks))
            })
          })

          downloadRequest.on('error', handleError)
          downloadRequest.end()
        } else {
          reject(new Error(`Unable to download release asset: ${response.statusCode} ${response.statusMessage}`))
        }
      },
    )

    request.on('error', handleError)
    request.end()
  })
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
        file: await downloadReleaseAsset(asset.url, token, logger),
        name: asset.name,
        version: release.tag_name,
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
