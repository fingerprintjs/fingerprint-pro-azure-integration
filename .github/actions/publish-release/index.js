const core = require('@actions/core')
const github = require('@actions/github')

async function main() {
  const token = core.getInput('token', { required: true })
  const client = github.getOctokit(token)

  const { context } = github

  console.log('repo', context.repo)

  const { data: pr } = await client.rest.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: context.payload.pull_request.number,
  })
  const tag = pr.title
  console.log('pr', pr)

  console.log('tag', tag)

  const { data: labels } = await client.rest.issues.listLabelsOnIssue({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.payload.pull_request.number,
  })

  console.log('labels', labels)

  const isRelease = labels.some((label) => label.name === 'release')

  if (isRelease && tag) {
    const release = await client.rest.repos.getReleaseByTag({
      owner: context.repo.owner,
      repo: context.repo.repo,
      tag,
    })

    if (release.data.draft) {
      await client.rest.repos.updateRelease({
        owner: context.repo.owner,
        repo: context.repo.repo,
        release_id: release.data.id,
        draft: false,
      })
    }
  }
}

main()
