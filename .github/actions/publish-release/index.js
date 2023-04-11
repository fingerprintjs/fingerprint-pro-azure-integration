const core = require('@actions/core')
const github = require('@actions/github')

async function main() {
  const token = core.getInput('token', { required: true })
  const client = github.getOctokit(token)

  const { context } = github

<<<<<<< HEAD
=======
  console.log('repo', context.repo)

  const tag = core.getInput('tag', { required: true })

  console.log('tag', tag)

  if (!tag) {
    console.info('No tag found, skipping release')

    return
  }

>>>>>>> 90a0121 (ci: add release workflow)
  const { data: pr } = await client.rest.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: context.payload.pull_request.number,
  })
<<<<<<< HEAD
  const tag = pr.title
=======
  console.log('pr', pr)
>>>>>>> 90a0121 (ci: add release workflow)

  console.log('tag', tag)

  const { data: labels } = await client.rest.issues.listLabelsOnIssue({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.payload.pull_request.number,
  })

<<<<<<< HEAD
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
=======
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
>>>>>>> 90a0121 (ci: add release workflow)
        draft: false,
      })
    }
  }
}

main()
