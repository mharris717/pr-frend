import { Octokit, App } from 'octokit'
import { Configuration, OpenAIApi } from 'openai'
import subProcess from 'child_process'
import fs from 'fs'
import simpleGit from 'simple-git'
import { LINES, SimplePrompt } from './prompt'
import { git, readRepoFile } from './git'
import { createPull } from './github'

// function stuff() {
//     const git = simpleGit()
//     git.
// }

const configuration = new Configuration({
  // apiKey: process.env.OPENAI_KEY,
  apiKey: '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',
})
const openai = new OpenAIApi(configuration)
const baseParams = { owner: 'mharris717', repo: 'todo-pr' }

// const token = "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"
const token = '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'
const octokit = new Octokit({ auth: token })

// async function respond(prNumber: number, commentId: number) {
//   const base = { ...baseParams, pull_number: prNumber, comment_id: commentId }
//   const comment = await octokit.rest.pulls.getReviewComment(base)
//   const body = comment.data.body
//   const patch = await askForPatch(comment.data.diff_hunk, body)
//   console.log('PATCH:', patch, 'DONE')
//   const pr = await createPrFromPatch(prNumber, patch)
//   return octokit.rest.pulls.createReplyForReviewComment({
//     ...base,
//     body: `Created PR #${pr} for this change`,
//   })
// }

async function respond(prNumber: number, commentId: number) {
  const base = { ...baseParams, pull_number: prNumber, comment_id: commentId }
  const comment = await octokit.rest.pulls.getReviewComment(base)
  const body = comment.data.body
  const file = comment.data.path
  await git.checkout('helppy')
  const prompt = new SimplePrompt({
    lines: LINES,
    data: {
      file_name: file,
      file_contents: readRepoFile(file),
      first_line_of_file: `${comment.data.start_line || 0}`,
      comment: body,
    },
  })
  const newBody = await prompt.ask()
  const newPr = await createPull({ prNumber, file, newBody })
  return octokit.rest.pulls.createReplyForReviewComment({
    ...base,
    body: `Created PR #${newPr} for this change`,
  })
}

async function getComments(prNumber: number) {
  const comments = await octokit.rest.pulls.listReviewComments({
    ...baseParams,
    pull_number: prNumber,
  })
  // console.log(comments.data)
  return comments.data
}

async function main() {
  const comments = await getComments(4)
  const id = comments[0].id
  // console.log(comments[0])
  await respond(4, id)
}

// async function translate(body: string) {
//   console.log('Translating', body)
//   const completion = await openai.createCompletion({
//     model: 'text-davinci-003',
//     // model: "gpt-3.5-turbo",
//     prompt: `Translate the following to French:\n\n"${body}"`,
//   })
//   console.log(completion.data)
//   return completion.data.choices[0].text
// }

// async function makeBranchFromPatch(base: string, patch: string) {
//   const repo = '/Users/mharris717/code/orig/todo-pr-clean'
//   const res = `patch-${new Date().getTime()}`
//   const patchPath = `/Users/mharris717/code/orig/pr-container/tmp/${res}.patch`
//   fs.writeFileSync(patchPath, patch)
//   const cmds = [
//     `cd ${repo}`,
//     `git fetch origin`,
//     `git checkout ${base}`,
//     `git pull origin ${base}`,
//     `git checkout -b ${res}`,
//     // `echo ${new Date().getTime()} > thing.txt`,
//     // `git add thing.txt`,
//     `git apply ${patchPath}`,
//     'git add .',
//     `git commit -m patch`,
//     `git push origin ${res}`,
//   ]
//   subProcess.execSync(cmds.join(' && '))
//   return res
// }

// async function createPrFromPatch(prNumber: number, patch: string) {
//   const pr = await octokit.rest.pulls.get({
//     ...baseParams,
//     pull_number: prNumber,
//   })
//   const newBase = pr.data.head.label.split(':')[1]
//   const newHead = await makeBranchFromPatch(newBase, patch)
//   const res = await octokit.rest.pulls.create({
//     ...baseParams,
//     title: `Patch from Robit ${new Date()}`,
//     head: newHead,
//     base: newBase,
//   })
//   return res.data.number
// }

// main()

// const PATCH = `From f16eb2f1d39c04fa4dd2339177f7149c41617370 Mon Sep 17 00:00:00 2001
// From: Mike Harris <mharris717@gmail.com>
// Date: Thu, 30 Mar 2023 11:11:15 -0400
// Subject: [PATCH] patch

// ---
//  thing.txt | 1 +
//  1 file changed, 1 insertion(+)
//  create mode 100644 thing.txt

// diff --git a/thing.txt b/thing.txt
// new file mode 100644
// index 0000000..34dc825
// --- /dev/null
// +++ b/thing.txt
// @@ -0,0 +1 @@
// +1680189074639
// `

main()
