import path from 'path'
import * as fs from 'fs'
import { storageClient } from './clients'
import { KnownKind, KnownSkuName } from '@azure/arm-storage'
import { execSync } from 'child_process'
import invariant from 'tiny-invariant'
import { ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob'
import glob from 'glob'
import { ExponentialBackoff, handleAll, retry } from 'cockatiel'

const websiteDistPath = path.resolve(__dirname, '../../example-website/dist')
if (!fs.existsSync(websiteDistPath)) {
  throw new Error(`Website dist folder not found at ${websiteDistPath}`)
}

export async function deployWebsite(resourceGroup: string) {
  const accountName = `e2ewebsite${Date.now()}`

  console.info(`Creating storage account for website: ${accountName}`)

  const poll = await storageClient.storageAccounts.beginCreate(resourceGroup, accountName, {
    kind: KnownKind.StorageV2,
    location: 'westus',
    sku: {
      tier: 'Standard',
      name: KnownSkuName.StandardLRS,
    },
    allowSharedKeyAccess: true,
    allowBlobPublicAccess: true,
  })

  const account = await poll.pollUntilDone()
  invariant(account.primaryEndpoints?.web, 'Storage account web endpoint not found')
  const accountUrl = `https://${account.name}.blob.core.windows.net/$web`

  const keys = await storageClient.storageAccounts.listKeys(resourceGroup, accountName)
  const key = keys?.keys?.[0]?.value
  invariant(key, 'Storage account key not found')

  console.info(`Storage account created: ${account.name}`)

  console.info('Enabling static website...')
  execSync(
    `az storage blob service-properties update --account-name ${accountName} --account-key ${key} --static-website --index-document index.html`,
    {
      env: process.env,
      stdio: 'pipe',
    },
  )
  console.info('Static website enabled.')

  const container = new ContainerClient(accountUrl, new StorageSharedKeyCredential(accountName, key))

  await uploadWebsite(container)
  await doHealthCheck(account.primaryEndpoints.web)

  return {
    url: account.primaryEndpoints.web,
    account,
  }
}

async function doHealthCheck(url: string) {
  console.info(`Performing website health check at ${url}`)

  const policy = retry(handleAll, {
    backoff: new ExponentialBackoff({
      initialDelay: 500,
    }),
  })
  return policy.execute(async ({ attempt }) => {
    if (attempt > 1) {
      console.info(`Health check attempt ${attempt}`)
    }

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Health check failed with status ${response.status}`)
    }

    console.info(`Health check succeeded with status ${response.status}`)
  })
}

async function uploadWebsite(container: ContainerClient) {
  const files = glob.sync(path.join(websiteDistPath, '**', '*'), {
    nodir: true,
  })

  console.log('Uploading website files...')

  await Promise.all(
    files.map(async (file) => {
      const parsedPath = path.parse(file)
      const contents = fs.readFileSync(file)

      const blob = container.getBlockBlobClient(
        parsedPath.dir.endsWith('assets') ? `assets/${parsedPath.base}` : parsedPath.base,
      )
      await blob.uploadData(contents, {
        blobHTTPHeaders: {
          blobContentType: getContentType(parsedPath.ext),
        },
      })
    }),
  )
}

function getContentType(ext: string) {
  switch (ext) {
    case '.html':
      return 'text/html'

    case '.js':
      return 'application/javascript'

    default:
      return 'application/octet-stream'
  }
}
