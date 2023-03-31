import { Configuration, OpenAIApi } from 'openai'
import fs from 'fs'
import { myLog } from './util'

const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY,
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
    return ask(this)
  }
}

export const LINES = [
  'I received a comment on my PR. I will provide you with the name and contents of the file in question, which part of the file was commented on, and the comment itself.',
  'Reply with the modified full contents of the file that makes the change requested by the comment.',
  `Your reply should contain exactly the modified full contents of the file, and nothing else. Don't supply a label. Every single character in your reply needs to be valid python`,
  `Your reply should look like this:
  NEWFILE:
  <CODE>`,
]

export async function ask(prompt: SimplePrompt): Promise<string> {
  myLog('Asking GPT for updated code based on comment')
  const completion = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: prompt.toString(),
    max_tokens: 1000,
  })
  const res = completion.data.choices[0].text
  if (!res) {
    throw new Error('No response from OpenAI')
  }
  fs.writeFileSync('reply.log', res)
  const [junk, code] = res.split('NEWFILE:')
  return code.trim() + '\n'
}
