import { Octokit } from 'octokit'
import { GitRepo } from './git'
import { myLog } from './util'

const token = process.env.GITHUB_TOKEN
export const octokit = new Octokit({ auth: token })

type PrResponse = Awaited<ReturnType<typeof octokit.rest.pulls.get>>
type CommentResponse = Awaited<
  ReturnType<typeof octokit.rest.pulls.getReviewComment>
>

interface Ops {
  file: string
  newBody: string
}

export async function createPullWithUpdatedFile(
  pr: GithubPR,
  { file, newBody }: Ops,
) {
  myLog(`Creating new PR for change triggered from PR ${pr.prNumber}`)

  const repo = pr.headGitRepo()
  const baseBranch = pr.headBranch.branch

  const newBranch = await repo.makeBranch({
    baseBranch,
    file,
    newBody,
  })

  const ops = {
    repo: pr.baseBranch.repo,
    owner: pr.baseBranch.owner,
    title: `Patch from Robit ${new Date()}`,
    head: newBranch,
    base: baseBranch,
  }

  const res = await octokit.rest.pulls.create(ops)
  myLog(
    `Created PR ${res.data.number} for change triggered from PR ${pr.prNumber}`,
  )
  return res.data.number
}

interface RepoBranch {
  owner: string
  repo: string
  branch: string
}

export class GithubPR {
  constructor(readonly prResponse: PrResponse) {}

  get prData() {
    return this.prResponse.data
  }

  get baseBranch(): RepoBranch {
    const { owner, name } = this.prData.base.repo
    const fullBranch = this.prData.base.label
    const [o, branch] = fullBranch.split(':')
    if (o !== owner.login) {
      throw new Error(`Owner mismatch: ${o} !== ${owner.login}`)
    }
    return {
      owner: owner.login,
      repo: name,
      branch,
    }
  }

  get headBranch(): RepoBranch {
    const { owner, name } = this.prData.head.repo!
    const fullBranch = this.prData.head.label
    const [o, branch] = fullBranch.split(':')
    if (o !== owner.login) {
      throw new Error(`Owner mismatch: ${o} !== ${owner.login}`)
    }
    return {
      owner: owner.login,
      repo: name,
      branch,
    }
  }

  get prNumber() {
    return this.prData.number
  }

  async getComment(id: number) {
    const res = await octokit.rest.pulls.getReviewComment({
      owner: this.baseBranch.owner,
      repo: this.baseBranch.repo,
      comment_id: id,
    })
    return new GithubComment(this, res)
  }

  headGitRepo() {
    return new GitRepo(this.headBranch.owner, this.headBranch.repo)
  }

  async getHeadFileContents(file: string) {
    return this.headGitRepo()
      .git()
      .show(`origin/${this.headBranch.branch}:${file}`)
  }

  static async get(owner: string, repo: string, prNumber: number) {
    const prResponse = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    })
    return new GithubPR(prResponse)
  }
}

class GithubComment {
  constructor(
    readonly pr: GithubPR,
    readonly commentResponse: CommentResponse,
  ) {}

  get commentData() {
    return this.commentResponse.data
  }

  get body() {
    return this.commentData.body
  }

  get line() {
    return this.commentData.line || 0
  }

  get file() {
    return this.commentData.path
  }

  fileContents() {
    return this.pr.getHeadFileContents(this.file)
  }

  reply(body: string) {
    return octokit.rest.pulls.createReplyForReviewComment({
      owner: this.pr.baseBranch.owner,
      repo: this.pr.baseBranch.repo,
      pull_number: this.pr.prNumber,
      body,
      comment_id: this.commentData.id,
    })
  }
}
