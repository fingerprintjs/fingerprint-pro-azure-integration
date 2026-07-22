import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fetchMock from 'fetch-mock'
import { config } from './config.ts'
import {
  downloadReleaseAsset,
  findFunctionZip,
  getLatestFunctionZip,
  getLatestGithubRelease,
  GithubRelease,
} from './github.ts'

const mockRelease = {
  url: 'https://api.github.com/repos/owner/repo/releases/123',
  name: 'v1.1.0',
  assets: [
    {
      name: 'package.zip',
      url: 'https://api.github.com/repos/owner/repo/releases/assets/124',
      state: 'uploaded',
      content_type: 'application/zip',
    },
  ],
  assets_url: 'https://api.github.com/repos/owner/repo/releases/123/assets',
  tag_name: '@fingerprint/azure-frontdoor-proxy@v1.1.0',
} satisfies GithubRelease

beforeEach(() => {
  fetchMock.hardReset()

  fetchMock.get(
    `https://api.github.com/repos/${config.repositoryOwner}/${config.repository}/releases/latest`,
    mockRelease
  )
})

describe('getLatestGithubRelease', () => {
  it('should return the latest release', async () => {
    const response = await getLatestGithubRelease('123')

    expect(response).toEqual(mockRelease)

    const call = fetchMock.callHistory.lastCall()
    const requestHeaders = call?.request?.headers

    expect(requestHeaders?.get('Authorization')).toEqual('Bearer 123')
  })
})

describe('downloadReleaseAsset', () => {
  it('should download asset', async () => {
    fetchMock.get(mockRelease.assets[0].url, 'Test')

    const response = await downloadReleaseAsset(mockRelease.assets[0].url, '123')

    expect(response.byteLength).toEqual(4)
    expect(response.toString()).toEqual('Test')
  })
})

describe('findFunctionZip', () => {
  it('should return correct asset', () => {
    const result = findFunctionZip(mockRelease.assets)

    expect(result).toEqual(mockRelease.assets[0])
  })
})

describe('getLatestFunctionZip', () => {
  beforeEach(() => {
    fetchMock.mockGlobal()
    fetchMock.get(mockRelease.assets[0].url, 'Test')
  })

  afterEach(() => {
    fetchMock.unmockGlobal()
  })

  it('should return latest zip if release version is greater than function version', async () => {
    const result = await getLatestFunctionZip(undefined, undefined, '1.0.0')

    expect(result?.name).toEqual(mockRelease.assets[0].name)
    expect(result?.version).toEqual('v1.1.0')
    expect(result?.file.byteLength).toEqual(4)
    expect(result?.file.toString()).toEqual('Test')
  })

  it('should return latest zip if release version is greater than function version for pre-release', async () => {
    fetchMock.hardReset().mockGlobal()
    fetchMock.get(`https://api.github.com/repos/${config.repositoryOwner}/${config.repository}/releases`, [
      {
        ...mockRelease,
        tag_name: `@fingerprint/azure-frontdoor-proxy@v1.1.0-rc.1`,
      },
    ])
    fetchMock.get(mockRelease.assets[0].url, 'Test')

    const result = await getLatestFunctionZip(undefined, undefined, '1.0.0', true)

    expect(result?.name).toEqual(mockRelease.assets[0].name)
    expect(result?.version).toEqual('v1.1.0-rc.1')
    expect(result?.file.byteLength).toEqual(4)
    expect(result?.file.toString()).toEqual('Test')
  })

  it.each(['2.0.0', '2.0.0-rc.1'])('should return null if major versions does not match', async (tagName) => {
    fetchMock.hardReset().mockGlobal()
    fetchMock.get(`https://api.github.com/repos/${config.repositoryOwner}/${config.repository}/releases/latest`, {
      ...mockRelease,
      tag_name: `@fingerprint/azure-frontdoor-proxy@${tagName}`,
    })

    const result = await getLatestFunctionZip(undefined, undefined, '1.5.0')

    expect(result).toBeNull()
    expect(fetchMock.callHistory.calls()).toHaveLength(1)
  })

  it('should return undefined if version is the same', async () => {
    const result = await getLatestFunctionZip(undefined, undefined, '1.1.0')

    expect(result).toBeNull()
  })
})
