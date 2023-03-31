import simpleGit from 'simple-git'
import fs from 'fs'
import { myLog } from './util'

const REPO_PATH = '/users/mharris717/code/orig/todo-pr-clean'
export const git = simpleGit(REPO_PATH)

interface MakeBranchOps {
  baseBranch: string
  newBody: string
  file: string
}

export async function makeBranch({ baseBranch, newBody, file }: MakeBranchOps) {
  myLog(`Creating new branch for change`)
  const branchName = `patch-${baseBranch}-${new Date().getTime()}`
  await git.checkout(baseBranch)
  await git.fetch('origin')
  await git.pull('origin', baseBranch)
  await git.checkoutBranch(branchName, baseBranch)
  fs.writeFileSync(`${REPO_PATH}/${file}`, newBody)
  await git.add(file)
  await git.commit(`patch`)
  await git.push('origin', branchName)
  return branchName
}

export function readRepoFile(file: string): string {
  return fs.readFileSync(`${REPO_PATH}/${file}`).toString()
}
