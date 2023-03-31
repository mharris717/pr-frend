import { Octokit } from 'octokit'
import { makeBranch } from './git'

const token = process.env.GITHUB_TOKEN
export const octokit = new Octokit({ auth: token })

const baseParams = { owner: 'mharris717', repo: 'todo-pr' }

interface Ops {
  prNumber: number
  file: string
  newBody: string
}

export async function createPull({ prNumber, file, newBody }: Ops) {
  console.log('call to createPull', { prNumber, file, newBody })
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
  console.log('create ops', ops)
  const res = await octokit.rest.pulls.create(ops)

  return res.data.number
}
