import { getSiteStatusUrl } from './site'

const client = {
  webApps: {
    listFunctions: jest.fn(),
  },
}

beforeEach(() => {
  jest.restoreAllMocks()
})

describe('getSiteStatusUrl', () => {
  it('should return correct url for proxy function', async () => {
    client.webApps.listFunctions.mockImplementation(async function* () {
      yield {
        config: {
          scriptFile: './fingerprint-pro-azure-function-management.js',
        },
      }

      yield {
        config: {
          scriptFile: './fingerprint-pro-azure-function.js',
        },
        invokeUrlTemplate: 'https://example.com/{*restofpath}',
      }
    })

    const result = await getSiteStatusUrl(client as any, 'resourceGroupName', 'siteName')

    expect(result).toEqual('https://example.com/fpjs/status?format=json')
  })

  it('should throw if proxy function cannot be found', async () => {
    client.webApps.listFunctions.mockImplementation(async function* () {
      yield {
        config: {
          scriptFile: './fingerprint-pro-azure-function-management.js',
        },
      }
    })

    await expect(getSiteStatusUrl(client as any, 'resourceGroupName', 'siteName')).rejects.toThrow(
      `Could not find proxy function for siteName in resourceGroupName resource group`
    )
  })
})
