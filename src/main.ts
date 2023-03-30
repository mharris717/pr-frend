import { Octokit, App } from "octokit";
import { Configuration, OpenAIApi } from 'openai'
import subProcess from 'child_process'
import fs from 'fs'
import simpleGit from 'simple-git'

// function stuff() {
//     const git = simpleGit()
//     git.
// }

const configuration = new Configuration({
    // apiKey: process.env.OPENAI_KEY,
    apiKey: "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",
});
const openai = new OpenAIApi(configuration);
const baseParams = { owner: "mharris717", repo: "todo-pr" }

// const token = "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"  
const token = "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"
const octokit = new Octokit({ auth: token })

const PATCH = `From f16eb2f1d39c04fa4dd2339177f7149c41617370 Mon Sep 17 00:00:00 2001
From: Mike Harris <mharris717@gmail.com>
Date: Thu, 30 Mar 2023 11:11:15 -0400
Subject: [PATCH] patch

---
 thing.txt | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 thing.txt

diff --git a/thing.txt b/thing.txt
new file mode 100644
index 0000000..34dc825
--- /dev/null
+++ b/thing.txt
@@ -0,0 +1 @@
+1680189074639
`

async function askForPatch(diff: string, comment: string) {
    const prompt = `I received a comment on my PR. I will provide you the diff that was commented on, the file in question, and the comment itself. Reply with a git patch file that makes the change requested by the comment. 

Don't say anything but the exact contents of the patch file
    
File:
---
help.py 
---

Diff:
---
${diff}
---

Comment:
---
${comment}
---

Example of a patch file:
---
From d16b94cc38fe9a3f0ae285fb6bbc35528ea22ebb Mon Sep 17 00:00:00 2001
From: Mike Harris <mharris717@gmail.com>
Date: Wed, 29 Mar 2023 13:40:32 -0400
Subject: [PATCH] morejunk

---
 .gitignore | 3 ++-
 1 file changed, 2 insertions(+), 1 deletion(-)

diff --git a/.gitignore b/.gitignore
index 96d1dc5..0d99aa7 100644
--- a/.gitignore
+++ b/.gitignore
@@ -22,4 +22,5 @@ dist-ssr
 *.njsproj
 *.sln
 *.sw?
-junkkkk
\ No newline at end of file
+junkkkk
+morejunkkkkk
\ No newline at end of file
---
`
    console.log(prompt)

    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        // model: "gpt-3.5-turbo",
        // model: "gpt-3.5-turbo",
        prompt  , 
        temperature: 0.7,
        stream: false,
        // echo: true,
        max_tokens: 500,
        
    });
    console.log(completion.data)
    const fullReply = completion.data.choices[0].text
    if (!fullReply) {
        throw new Error("No response from OpenAI")
    }
    console.log(fullReply)
    return fullReply
    // if (!fullReply.includes("diff")) {
    //     throw new Error("Response from OpenAI did not include a patch")
    // }
    // const res = "diff" + fullReply.split("diff")[1] + "\n"
    // return res 
}


async function respond(prNumber: number, commentId: number) {
    const base = { ...baseParams, pull_number: prNumber, comment_id: commentId }
    const comment = await octokit.rest.pulls.getReviewComment(base)
    const body = comment.data.body
    const patch = await askForPatch(comment.data.diff_hunk, body)
    console.log("PATCH:",patch,"DONE")
    const pr = await createPrFromPatch(prNumber, patch)
    return octokit.rest.pulls.createReplyForReviewComment({
        ...base,
        body: `Created PR #${pr} for this change`
    })
}

async function getComments(prNumber: number) {
    const comments = await octokit.rest.pulls.listReviewComments({ ...baseParams, pull_number: prNumber })
    // console.log(comments.data)
    return comments.data
}

async function main() {
    const comments = await getComments(4)
    const id = comments[0].id
    // console.log(comments[0])
    await respond(4, id)
}

async function translate(body: string) {
    console.log("Translating", body)
    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        // model: "gpt-3.5-turbo",
        prompt: `Translate the following to French:\n\n"${body}"`,
    });
    console.log(completion.data)
    return completion.data.choices[0].text
}

async function makeBranchFromPatch(base: string, patch: string) {
    const repo = "/Users/mharris717/code/orig/todo-pr-clean"
    const res = `patch-${new Date().getTime()}`
    const patchPath = `/Users/mharris717/code/orig/pr-container/tmp/${res}.patch`
    fs.writeFileSync(patchPath, patch)
    const cmds = [
        `cd ${repo}`,
        `git fetch origin`,
        `git checkout ${base}`,
        `git pull origin ${base}`,
        `git checkout -b ${res}`,
        // `echo ${new Date().getTime()} > thing.txt`,
        // `git add thing.txt`,
        `git apply ${patchPath}`,
        "git add .",
        `git commit -m patch`,
        `git push origin ${res}`,
    ]
    subProcess.execSync(cmds.join(" && "))
    return res
}

async function createPrFromPatch(prNumber: number, patch: string) {
    const pr = await octokit.rest.pulls.get({ ...baseParams, pull_number: prNumber })
    const newBase = pr.data.head.label.split(":")[1]
    const newHead = await makeBranchFromPatch(newBase, patch)
    const res = await octokit.rest.pulls.create({
        ...baseParams,
        title: `Patch from Robit ${new Date()}`,
        head: newHead,
        base: newBase,
    })
    return res.data.number
}

main()