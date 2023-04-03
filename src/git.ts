import simpleGit from 'simple-git'
import fs from 'fs'
import { myLog } from './util'
import path from 'path'

const REPOS_PATH = path.join(__dirname, '..', 'repos')

interface MakeBranchOps {
  baseBranch: string
  newBody: string
  file: string
}

function ensureRepoCheckout(owner: string, repo: string) {
  const local = `${REPOS_PATH}/${owner}_${repo}`
  if (!fs.existsSync(local)) {
    // fs.mkdirSync(local, { recursive: true })
    simpleGit().clone(`git@github.com:${owner}/${repo}.git`, local)
  }
  return local
}

export class GitRepo {
  owner: string
  repo: string
  local: string
  constructor(owner: string, repo: string) {
    this.owner = owner
    this.repo = repo
    this.local = ensureRepoCheckout(owner, repo)
  }

  git() {
    return simpleGit(this.local)
  }

  async makeBranch({ baseBranch, newBody, file }: MakeBranchOps) {
    const git = this.git()
    myLog(`Creating new branch for change`)
    const branchName = `patch-${baseBranch}-${new Date().getTime()}`
    await git.checkout(baseBranch)
    await git.fetch('origin')
    await git.pull('origin', baseBranch)
    await git.checkoutBranch(branchName, baseBranch)
    fs.writeFileSync(`${this.local}/${file}`, newBody)
    await git.add(file)
    await git.commit(`patch`)
    await git.push('origin', branchName)
    return branchName
  }
}
