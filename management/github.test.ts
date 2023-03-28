import fetchMock from 'fetch-mock'
import { config } from './config'
import {
  downloadReleaseAsset,
  findFunctionZip,
  getLatestFunctionZip,
  getLatestGithubRelease,
  GithubRelease,
} from './github'

const mockRelease = {
  url: 'https://api.github.com/repos/owner/repo/releases/123',
  name: 'v1.0.0',
  assets: [
    {
      name: 'v1.0.0.zip',
      url: 'https://api.github.com/repos/owner/repo/releases/assets/123',
      state: 'uploaded',
      content_type: 'application/zip',
    },
    {
      name: 'v1.0.0.txt',
      url: 'https://api.github.com/repos/owner/repo/releases/assets/456',
      state: 'uploaded',
      content_type: 'text/plain',
    },
  ],
  assets_url: 'https://api.github.com/repos/owner/repo/releases/123/assets',
  tag_name: 'v1.0.0',
} satisfies GithubRelease

beforeEach(() => {
  fetchMock.reset()

  fetchMock.get(
    `https://api.github.com/repos/${config.repositoryOwner}/${config.repository}/releases/latest`,
    mockRelease,
  )
})

describe('getLatestGithubRelease', () => {
  it('should return the latest release', async () => {
    const response = await getLatestGithubRelease('123')

    expect(response).toEqual(mockRelease)

    const call = fetchMock.lastCall()
    const requestHeaders = call?.[1]?.headers as Record<string, string> | undefined

    expect(requestHeaders?.Authorization).toEqual('Bearer 123')
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
  it('should return correct asset', async () => {
    const result = await findFunctionZip(mockRelease.assets)

    expect(result).toEqual(mockRelease.assets[0])
  })
})

describe('getLatestFunctionZip', () => {
  beforeEach(() => {
    fetchMock.get(mockRelease.assets[0].url, 'Test')
  })

  it('should return latest zip if release version is greater than function version', async () => {
    const result = await getLatestFunctionZip(undefined, undefined, '0.0.1')

    expect(result?.name).toEqual(mockRelease.assets[0].name)
    expect(result?.version).toEqual(mockRelease.tag_name)
    expect(result?.file.byteLength).toEqual(4)
    expect(result?.file.toString()).toEqual('Test')
  })

  it('should return undefined if version is the same', async () => {
    const result = await getLatestFunctionZip(undefined, undefined, '1.0.0')

    expect(result).toBeNull()
  })
})
