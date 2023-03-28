import { removeOldFunctionFromStorage } from './storage'

describe('removeOldFunctionFromStorage', () => {
  it('should remove given zip from storage', async () => {
    const client = {
      deleteBlob: jest.fn(),
    }

    const oldZipUrl = 'https://storageaccount.blob.core.windows.net/function-zips/zipname.zip'
    const newZipUrl = 'https://storageaccount.blob.core.windows.net/function-zips/v0.1.0.zip'

    await removeOldFunctionFromStorage(oldZipUrl, newZipUrl, client as any)

    expect(client.deleteBlob).toHaveBeenCalledWith('zipname.zip')
  })

  it('should not remove given zip from storage if it is the same as the new one', async () => {
    const client = {
      deleteBlob: jest.fn(),
    }

    const oldZipUrl = 'https://storageaccount.blob.core.windows.net/function-zips/zipname.zip'

    await removeOldFunctionFromStorage(oldZipUrl, oldZipUrl, client as any)

    expect(client.deleteBlob).not.toHaveBeenCalled()
  })
})
