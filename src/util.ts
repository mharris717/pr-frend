import { format } from 'date-fns'

export function myLog(...args: any[]) {
  const d = format(new Date(), 'HH:mm:ss') // Format the current date and time as HOUR:MINUTE:SECOND

  console.log(`[${d}]`, ...args)
}

export interface RepoIdentifier {
  owner: string
  repo: string
}
