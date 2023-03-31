import { Octokit } from 'octokit'
import { makeBranch } from './git'
import { myLog } from './util'

const token = process.env.GITHUB_TOKEN
export const octokit = new Octokit({ auth: token })

const baseParams = { owner: 'mharris717', repo: 'todo-pr' }

interface Ops {
  prNumber: number
  file: string
  newBody: string
}

export async function createPull({ prNumber, file, newBody }: Ops) {
  myLog(`Creating new PR for change triggered from PR ${prNumber}`)
  const pr = await octokit.rest.pulls.get({
    ...baseParams,
    pull_number: prNumber,
  })

  const baseBranch = pr.data.head.label.split(':')[1]

  const newBranch = await makeBranch({
    baseBranch,
    file,
    newBody,
  })

  const ops = {
    ...baseParams,
    title: `Patch from Robit ${new Date()}`,
    head: newBranch,
    base: baseBranch,
  }

  const res = await octokit.rest.pulls.create(ops)
  myLog(
    `Created PR ${res.data.number} for change triggered from PR ${prNumber}`,
  )
  return res.data.number
}
