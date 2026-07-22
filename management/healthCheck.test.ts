import { beforeEach, describe, expect, it, vi } from 'vitest'
import fetchMock from 'fetch-mock'
import { performHealthCheckAfterUpdate } from './healthCheck'
import { BACKUP_PACKAGE_BLOB, RELEASED_PACKAGE_BLOB } from './settings'

describe('performHealthCheckAfterUpdate', () => {
  const mockCopyPoller = {
    pollUntilDone: vi.fn().mockResolvedValue(undefined),
  }

  const mockBackupBlobClient = {
    beginCopyFromURL: vi.fn().mockResolvedValue(mockCopyPoller),
    url: `https://storageaccount.blob.core.windows.net/function-releases/${BACKUP_PACKAGE_BLOB}`,
  }

  const mockReleasedBlobClient = {
    beginCopyFromURL: vi.fn().mockResolvedValue(mockCopyPoller),
    url: `https://storageaccount.blob.core.windows.net/function-releases/${RELEASED_PACKAGE_BLOB}`,
  }

  const mockStorageClient = {
    deleteBlob: vi.fn(),
    getBlockBlobClient: vi.fn().mockImplementation((name: string) => {
      if (name === BACKUP_PACKAGE_BLOB) {
        return mockBackupBlobClient
      }
      if (name === RELEASED_PACKAGE_BLOB) {
        return mockReleasedBlobClient
      }
      throw new Error(`Unexpected blob name: ${name}`)
    }),
  }

  const statusUrl = 'https://example.org/fpjs/status'

  beforeEach(() => {
    vi.restoreAllMocks()
    mockStorageClient.deleteBlob.mockClear()
    mockBackupBlobClient.beginCopyFromURL.mockClear()
    mockReleasedBlobClient.beginCopyFromURL.mockClear()
    mockCopyPoller.pollUntilDone.mockClear()
    fetchMock.hardReset()
    fetchMock.mockGlobal()
  })

  it('should delete backup if health check passed', async () => {
    fetchMock.get(statusUrl, {
      version: '1.0.0',
      envInfo: [],
    })

    await performHealthCheckAfterUpdate({
      newVersion: '1.0.0',
      statusUrl,
      storageClient: mockStorageClient as any,
      checkInterval: 500,
      restartApp: vi.fn(),
    })

    expect(mockStorageClient.deleteBlob).toHaveBeenCalledWith(BACKUP_PACKAGE_BLOB)
  })

  it('should retry status request', async () => {
    fetchMock.getOnce(statusUrl, { version: '0.0.1', envInfo: [] })
    fetchMock.getOnce(statusUrl, { version: '0.0.1', envInfo: [] })
    fetchMock.getOnce(statusUrl, { version: '1.0.0', envInfo: [] })

    await performHealthCheckAfterUpdate({
      newVersion: '1.0.0',
      statusUrl,
      storageClient: mockStorageClient as any,
      checkInterval: 500,
      restartApp: vi.fn(),
    })

    expect(mockStorageClient.deleteBlob).toHaveBeenCalledWith(BACKUP_PACKAGE_BLOB)
  })

  it('should rollback by restoring backup on timeout', async () => {
    fetchMock.get(statusUrl, { version: '0.0.1', envInfo: [] })

    await expect(
      performHealthCheckAfterUpdate({
        newVersion: '1.0.0',
        statusUrl,
        storageClient: mockStorageClient as any,
        checkInterval: 100,
        restartApp: vi.fn(),
      })
    ).rejects.toThrow('Version mismatch, expected: 1.0.0, received: 0.0.1')

    expect(mockStorageClient.deleteBlob).not.toHaveBeenCalled()
    expect(mockReleasedBlobClient.beginCopyFromURL).toHaveBeenCalledWith(mockBackupBlobClient.url)
    expect(mockCopyPoller.pollUntilDone).toHaveBeenCalled()
  }, 30_000)
})
