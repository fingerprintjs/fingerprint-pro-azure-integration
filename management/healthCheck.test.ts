import fetchMock from 'fetch-mock'
import { StatusInfo } from '../shared/status'
import { performHealthCheckAfterUpdate } from './healthCheck'
import { WEBSITE_RUN_FROM_PACKAGE } from './settings'

describe('performHealthCheckAfterUpdate', () => {
  const mockClient = {
    webApps: {
      updateApplicationSettings: jest.fn(),
    },
  }
  const mockStorageClient = {
    deleteBlob: jest.fn(),
  }

  const statusUrl = 'https://example.org/fpjs/status'
  const oldFunctionZipUrl = 'https://storageaccount.blob.core.windows.net/function-zips/zipname.zip'
  const newFunctionZipUrl = 'https://storageaccount.blob.core.windows.net/function-zips/v1.0.0.zip'

  beforeEach(() => {
    jest.restoreAllMocks()

    fetchMock.reset()
  })

  it('should remove old function from storage if health check passed', async () => {
    fetchMock.get(statusUrl, {
      version: '1.0.0',
      envInfo: [],
    } as StatusInfo)

    await performHealthCheckAfterUpdate({
      settings: {},
      appName: 'test-app',
      resourceGroupName: 'test-resource',
      client: mockClient as any,
      oldFunctionZipUrl,
      newVersion: '1.0.0',
      statusUrl,
      storageClient: mockStorageClient as any,
      timeoutMs: 500,
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
      { overwriteRoutes: false },
    )

    fetchMock.getOnce(
      statusUrl,
      {
        version: '1.0.0',
        envInfo: [],
      } as StatusInfo,
      { overwriteRoutes: false },
    )

    await performHealthCheckAfterUpdate({
      settings: {},
      appName: 'test-app',
      resourceGroupName: 'test-resource',
      client: mockClient as any,
      oldFunctionZipUrl,
      newVersion: '1.0.0',
      statusUrl,
      storageClient: mockStorageClient as any,
      waitBetweenRequestsMs: 100,
      timeoutMs: 500,
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
      { overwriteRoutes: false },
    )

    await expect(
      performHealthCheckAfterUpdate({
        settings: {},
        appName: 'test-app',
        resourceGroupName: 'test-resource',
        client: mockClient as any,
        oldFunctionZipUrl,
        newVersion: '1.0.0',
        statusUrl,
        storageClient: mockStorageClient as any,
        waitBetweenRequestsMs: 100,
        timeoutMs: 500,
        newFunctionZipUrl,
      }),
    ).rejects.toThrow('Operation Timeout')

    expect(mockStorageClient.deleteBlob).toHaveBeenCalledTimes(0)
    expect(mockClient.webApps.updateApplicationSettings).toHaveBeenCalledWith('test-resource', 'test-app', {
      properties: {
        [WEBSITE_RUN_FROM_PACKAGE]: oldFunctionZipUrl,
      },
    })
  })
})
