import { LINES, SimplePrompt } from './prompt'
import { createPullWithUpdatedFile, GithubPR, octokit } from './github'
import { myLog } from './util'

async function respond(pr: GithubPR, commentId: number) {
  const comment = await pr.getComment(commentId)
  const prompt = new SimplePrompt({
    lines: LINES,
    data: {
      file_name: comment.file,
      file_contents: await comment.fileContents(),
      first_line_of_file: `${comment.line}`,
      comment: comment.body,
    },
  })
  const newBody = await prompt.ask()
  const newPr = await createPullWithUpdatedFile(pr, {
    file: comment.file,
    newBody,
  })
  await comment.reply(`Created PR #${newPr} for this change`)
}

interface Ops {
  pr: number
  comment: number
  owner: string
  repo: string
}

export async function possiblyRespond(ops: Ops) {
  const base = {
    owner: ops.owner,
    repo: ops.repo,
    pull_number: ops.pr,
    comment_id: ops.comment,
  }
  const comment = await octokit.rest.pulls.getReviewComment(base)
  const { body, in_reply_to_id } = comment.data
  if (body.trim() === '/robit PR') {
    const pr = await GithubPR.get(ops.owner, ops.repo, ops.pr)
    await respond(pr, in_reply_to_id!)
  } else {
    myLog(`Ignoring comment" "${body}"`)
  }
}

export async function forceRespond(ops: Ops) {
  const base = {
    owner: ops.owner,
    repo: ops.repo,
    pull_number: ops.pr,
    comment_id: ops.comment,
  }
  const pr = await GithubPR.get(ops.owner, ops.repo, ops.pr)
  await respond(pr, ops.comment)
}

// async function getComments(prNumber: number) {
//   const comments = await octokit.rest.pulls.listReviewComments({
//     ...baseParams,
//     pull_number: prNumber,
//   })
//   return comments.data
// }

// https://github.com/hwchase17/langchain/pull/965/files?w=1#r1114829890

async function main() {
  // const comments = await getComments(4)
  // const id = comments.at(-1)!.id
  // const id = 1154549989
  // await respond(4, id)
  // https://github.com/hwchase17/langchain/pull/2106
  // const pr = await GithubPR.get('hwchase17', 'langchain', 2106)
  // console.log(pr.baseBranch)
  // console.log(pr.headBranch)
  // return forceRespond({
  //   pr: 965,
  //   comment: 1114829890,
  //   owner: 'hwchase17',
  //   repo: 'langchain',
  // })
  // const foo = await git.show('HEAD:help.py')
  // console.log(foo)
}

if (require.main === module) {
  // This code will only run when the file is invoked directly
  main()
}
