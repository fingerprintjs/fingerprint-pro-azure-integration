const core = require('@actions/core')
const github = require('@actions/github')

async function main() {
  const token = core.getInput('token', { required: true })
  const client = github.getOctokit(token)

  const { context } = github

  const { data: pr } = await client.rest.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: context.payload.pull_request.number,
  })
  const tag = pr.title

  console.log('tag', tag)

  const { data: labels } = await client.rest.issues.listLabelsOnIssue({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.payload.pull_request.number,
  })

  const isRelease = labels.some((label) => label.name === 'release')

  if (isRelease && tag) {
    const releases = await client.rest.repos.listReleases({
      owner: context.repo.owner,
      repo: context.repo.repo,
    })
    const release = releases.data.find((release) => release.tag_name === tag && release.draft)

    if (release) {
      await client.rest.repos.updateRelease({
        owner: context.repo.owner,
        repo: context.repo.repo,
        release_id: release.id,
        draft: false,
      })
    }
  }
}

main()
