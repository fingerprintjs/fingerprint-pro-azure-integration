import { createPackageBackup, deletePackageBackup, restorePackageFromBackup } from './storage'
import { BACKUP_PACKAGE_BLOB, RELEASED_PACKAGE_BLOB } from './settings'

const mockCopyPoller = {
  pollUntilDone: vi.fn().mockResolvedValue(undefined),
}

const mockBackupBlobClient = {
  beginCopyFromURL: vi.fn().mockResolvedValue(mockCopyPoller),
  url: `https://storageaccount.blob.core.windows.net/function-releases/${BACKUP_PACKAGE_BLOB}`,
  exists: vi.fn().mockResolvedValue(false),
}

const mockReleasedBlobClient = {
  beginCopyFromURL: vi.fn().mockResolvedValue(mockCopyPoller),
  url: `https://storageaccount.blob.core.windows.net/function-releases/${RELEASED_PACKAGE_BLOB}`,
}

const mockContainerClient = {
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

beforeEach(() => {
  vi.clearAllMocks()
  mockCopyPoller.pollUntilDone.mockResolvedValue(undefined)
  mockBackupBlobClient.beginCopyFromURL.mockResolvedValue(mockCopyPoller)
  mockReleasedBlobClient.beginCopyFromURL.mockResolvedValue(mockCopyPoller)
})

describe('createPackageBackup', () => {
  it('should copy released-package.zip to released-package-backup.zip', async () => {
    await createPackageBackup(mockContainerClient as any)

    expect(mockBackupBlobClient.beginCopyFromURL).toHaveBeenCalledWith(mockReleasedBlobClient.url)
    expect(mockCopyPoller.pollUntilDone).toHaveBeenCalled()
  })
})

describe('restorePackageFromBackup', () => {
  it('should copy released-package-backup.zip back to released-package.zip', async () => {
    await restorePackageFromBackup(mockContainerClient as any)

    expect(mockReleasedBlobClient.beginCopyFromURL).toHaveBeenCalledWith(mockBackupBlobClient.url)
    expect(mockCopyPoller.pollUntilDone).toHaveBeenCalled()
  })
})

describe('deletePackageBackup', () => {
  it('should delete released-package-backup.zip', async () => {
    await deletePackageBackup(mockContainerClient as any)

    expect(mockContainerClient.deleteBlob).toHaveBeenCalledWith(BACKUP_PACKAGE_BLOB)
  })
})
