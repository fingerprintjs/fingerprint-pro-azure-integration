import fetchMock from 'fetch-mock'
import { StatusInfo } from '../shared/status'
import { performHealthCheckAfterUpdate } from './healthCheck'

describe('performHealthCheckAfterUpdate', () => {
  const mockClient = {
    webApps: {
      beginCreateOrUpdateAndWait: jest.fn(),
    },
  }
  const mockStorageClient = {
    deleteBlob: jest.fn(),
  }

  const statusUrl = 'https://example.org/fpjs/status'
  const oldFunctionZipUrl = 'https://storageaccount.blob.core.windows.net/function-zips/zipname.zip'
  const newFunctionZipUrl = 'https://storageaccount.blob.core.windows.net/function-zips/v1.0.0.zip'

  const mockSite = {
    location: 'eastus',
    functionAppConfig: {
      deployment: {
        storage: {
          type: 'blobContainer',
          value: oldFunctionZipUrl,
          authentication: {
            type: 'UserAssignedIdentity',
          },
        },
      },
    },
  }

  beforeEach(() => {
    jest.restoreAllMocks()

    mockStorageClient.deleteBlob.mockClear()
    mockClient.webApps.beginCreateOrUpdateAndWait.mockClear()

    fetchMock.reset()
  })

  it('should remove old function from storage if health check passed', async () => {
    fetchMock.get(statusUrl, {
      version: '1.0.0',
      envInfo: [],
    } as StatusInfo)

    await performHealthCheckAfterUpdate({
      site: mockSite as any,
      appName: 'test-app',
      resourceGroupName: 'test-resource',
      client: mockClient as any,
      oldFunctionZipUrl,
      newVersion: '1.0.0',
      statusUrl,
      storageClient: mockStorageClient as any,
      checkInterval: 500,
      newFunctionZipUrl,
    })

    expect(mockStorageClient.deleteBlob).toHaveBeenCalledWith('zipname.zip')
  })

  it('should retry status request', async () => {
    fetchMock.getOnce(statusUrl, {
      version: '0.0.1',
      envInfo: [],
    } as StatusInfo)

    fetchMock.getOnce(
      statusUrl,
      {
        version: '0.0.1',
        envInfo: [],
      } as StatusInfo,
      { overwriteRoutes: false }
    )

    fetchMock.getOnce(
      statusUrl,
      {
        version: '1.0.0',
        envInfo: [],
      } as StatusInfo,
      { overwriteRoutes: false }
    )

    await performHealthCheckAfterUpdate({
      site: mockSite as any,
      appName: 'test-app',
      resourceGroupName: 'test-resource',
      client: mockClient as any,
      oldFunctionZipUrl,
      newVersion: '1.0.0',
      statusUrl,
      storageClient: mockStorageClient as any,
      checkInterval: 500,
      newFunctionZipUrl,
    })

    expect(mockStorageClient.deleteBlob).toHaveBeenCalledWith('zipname.zip')
  })

  it('should rollback on timeout', async () => {
    fetchMock.get(
      statusUrl,
      {
        version: '0.0.1',
        envInfo: [],
      } as StatusInfo,
      { overwriteRoutes: false }
    )

    await expect(
      performHealthCheckAfterUpdate({
        site: mockSite as any,
        appName: 'test-app',
        resourceGroupName: 'test-resource',
        client: mockClient as any,
        oldFunctionZipUrl,
        newVersion: '1.0.0',
        statusUrl,
        storageClient: mockStorageClient as any,
        checkInterval: 100,
        newFunctionZipUrl,
      })
    ).rejects.toThrow('Version mismatch, expected: 1.0.0, received: 0.0.1')

    expect(mockStorageClient.deleteBlob).toHaveBeenCalledTimes(0)
    expect(mockClient.webApps.beginCreateOrUpdateAndWait).toHaveBeenCalledWith(
      'test-resource',
      'test-app',
      expect.objectContaining({
        functionAppConfig: expect.objectContaining({
          deployment: expect.objectContaining({
            storage: expect.objectContaining({
              value: oldFunctionZipUrl,
            }),
          }),
        }),
      })
    )
  }, 30_000)
})
