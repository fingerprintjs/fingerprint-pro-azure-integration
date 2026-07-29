import { config } from '../management/config.ts'
import { bearer, downloadReleaseAsset, findFunctionZip, type GithubRelease } from '../management/github.ts'
import { assertIsTruthy, isTruthy } from '../shared/assert.ts'
import fs from 'fs'
import path from 'path'

const dirname = path.dirname(new URL(import.meta.url).pathname)

async function main() {
  const tag = process.env.TAG
  const token = process.env.GITHUB_TOKEN

  assertIsTruthy(tag, 'TAG environment variable is required')

  console.debug('tag', tag)

  const url = `https://api.github.com/repos/${config.repositoryOwner}/${config.repository}/releases/tags/${tag}`

  console.debug('url', url)

  const response = await fetch(url, {
    headers: isTruthy(token)
      ? {
          Authorization: bearer(token),
        }
      : undefined,
  })
  // `Response.json()` is untyped (returns `any`), so we assert the parsed shape here.
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const githubRelease = (await response.json()) as GithubRelease

  console.debug('githubRelease', githubRelease)

  const functionZip = findFunctionZip(githubRelease.assets)

  console.debug('functionZip', functionZip)

  if (!functionZip) {
    throw new Error('No function zip found')
  }

  const asset = await downloadReleaseAsset(functionZip.url, token)

  fs.writeFileSync(path.resolve(dirname, '../package.zip'), asset)
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
