import { LINES, SimplePrompt } from './prompt'
import { git, readRepoFile } from './git'
import { createPull, octokit } from './github'

const baseParams = { owner: 'mharris717', repo: 'todo-pr' }

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
      first_line_of_file: `${comment.data.line || 0}`,
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
  return comments.data
}

async function main() {
  // const comments = await getComments(4)
  // const id = comments.at(-1)!.id
  const id = 1154549989
  console.log('Comment ID: ', id)
  await respond(4, id)
}

main()
