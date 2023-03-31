import { Configuration, OpenAIApi } from 'openai'

const configuration = new Configuration({
  // apiKey: process.env.OPENAI_KEY,
  apiKey: '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',
})
const openai = new OpenAIApi(configuration)

interface PromptOps {
  lines: string[]
  data: { [k: string]: string }
}

export class SimplePrompt {
  lines: string[]
  data: { [k: string]: string }
  constructor({ lines, data }: PromptOps) {
    this.lines = lines
    this.data = data
  }
  toString() {
    const lineStr = this.lines.join('\n\n')
    const dataStr = Object.entries(this.data)
      .map(([k, v]) => `${k}:\n---\n${v}\n---`)
      .join('\n\n')
    return `${lineStr}\n\n${dataStr}`
  }

  ask() {
    console.log(this.toString())
    return ask(this)
  }
}

export const LINES = [
  'I received a comment on my PR. I will provide you with the name and contents of the file in question, which part of the file was commented on, and the comment itself.',
  'Reply with the modified full contents of the file that makes the change requested by the comment.',
  `Your reply should be json, like this: {"body": <NEWBODY>}`,
  // "Don't say anything but the exact contents of the patch file",
]

export async function ask(prompt: SimplePrompt): Promise<string> {
  const completion = await openai.createCompletion({
    model: 'text-davinci-003',
    // model: "gpt-3.5-turbo",
    prompt: prompt.toString(),
    max_tokens: 1000,
  })
  console.log(completion.data)
  const res = completion.data.choices[0].text
  if (!res) {
    throw new Error('No response from OpenAI')
  }
  console.log('GPT Returned', res)
  return JSON.parse(res).body
}

// interface AskOps {
//   file: string
// }

// export function askForUpdatedFile({ file }: AskOps) {
//   const prompt = new SimplePrompt({
//     lines: LINES,
//     data: {
//       File: 'help.py',
//       Diff: 'diff --git a/.gitignore b/.gitignore',
//       Comment: 'This is a comment',
//     },
//   })
//   console.log(prompt.toString())
// }
