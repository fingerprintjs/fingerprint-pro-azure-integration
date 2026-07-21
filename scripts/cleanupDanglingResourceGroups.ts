import { DefaultAzureCredential } from '@azure/identity'
import { ResourceManagementClient } from '@azure/arm-resources'

const RESOURCE_GROUP_NAME_REGEX = /^fpjs-dev-e2e-(\d+)$/
// 6h
const MAX_AGE_MS = 6 * 60 * 60 * 1000

async function main() {
  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID
  if (!subscriptionId) {
    throw new Error('AZURE_SUBSCRIPTION_ID is required')
  }

  const dryRun = process.env.DRY_RUN === 'true'
  const now = Date.now()

  const client = new ResourceManagementClient(new DefaultAzureCredential(), subscriptionId)

  const deletions: Promise<unknown>[] = []
  let scanned = 0
  let matched = 0
  let stale = 0

  for await (const group of client.resourceGroups.list()) {
    scanned++
    const name = group.name
    if (!name) {
      continue
    }

    const match = name.match(RESOURCE_GROUP_NAME_REGEX)
    if (!match) {
      continue
    }
    matched++

    const timestamp = Number(match[1])
    if (!Number.isFinite(timestamp)) {
      console.warn(`Skipping ${name}: invalid timestamp`)
      continue
    }

    const ageMs = now - timestamp
    if (ageMs <= MAX_AGE_MS) {
      console.info(`Keeping ${name} (age ${Math.round(ageMs / 60000)}m)`)
      continue
    }

    stale++
    const ageHours = (ageMs / (60 * 60 * 1000)).toFixed(1)
    if (dryRun) {
      console.info(`[dry-run] Would delete ${name} (age ${ageHours}h)`)
      continue
    }

    console.info(`Deleting ${name} (age ${ageHours}h)`)
    deletions.push(
      client.resourceGroups
        .beginDelete(name)
        .then(() => {
          console.info(`Initiated deletion of ${name}`)
        })
        .catch((err) => {
          console.error(`Failed to delete ${name}:`, err)
        })
    )
  }

  await Promise.all(deletions)

  console.info(`Done. Scanned ${scanned} groups, matched ${matched}, stale ${stale}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
