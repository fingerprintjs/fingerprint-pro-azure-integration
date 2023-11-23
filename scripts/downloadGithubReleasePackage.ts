import { config } from '../management/config'
import { bearer, downloadReleaseAsset, findFunctionZip, GithubRelease } from '../management/github'
import fs from 'fs'
import path from 'path'

async function main() {
  const tag = process.env.TAG
  const token = process.env.GITHUB_TOKEN

  if (!tag) {
    throw new Error('TAG environment variable is required')
  }

  const githubRelease: GithubRelease = await fetch(
    `https://api.github.com/repos/${config.repositoryOwner}/${config.repository}/releases/tags/${tag}`,
    {
      headers: token
        ? {
            Authorization: bearer(token),
          }
        : undefined,
    },
  ).then((res) => res.json())

  const functionZip = await findFunctionZip(githubRelease.assets)

  if (!functionZip) {
    throw new Error('No function zip found')
  }

  const asset = await downloadReleaseAsset(functionZip.url, token)

  fs.writeFileSync(path.resolve(__dirname, '../package.zip'), asset)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
