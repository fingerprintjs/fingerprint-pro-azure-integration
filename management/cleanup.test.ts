import { removeOldFunctionFromStorage } from './cleanup'

describe('removeOldFunctionFromStorage', () => {
  it('should remove given zip from storage', async () => {
    const client = {
      deleteBlob: jest.fn(),
    }

    const zipUrl = 'https://storageaccount.blob.core.windows.net/function-zips/zipname.zip'

    await removeOldFunctionFromStorage(zipUrl, client as any)

    expect(client.deleteBlob).toHaveBeenCalledWith('zipname.zip')
  })
})
