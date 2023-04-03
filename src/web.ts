import express from 'express'
import { z } from 'zod'
import { possiblyRespond } from './main'
import { myLog } from './util'

const CommentQueryParams = z.object({
  pr: z.coerce.number(),
  comment: z.coerce.number(),
  owner: z.string(),
  repo: z.string(),
})

function runWebserver() {
  const app = express()
  const port = process.env.PORT

  app.get('/', (req, res) => {
    res.send(`Call to root with query ${req.query}`)
  })

  // app.get('/comment', async (req, res) => {
  //   const params = CommentQueryParams.parse(req.query)
  //   console.log(params)
  //   await possiblyRespond(params.pr, params.comment)
  //   res.send(JSON.stringify(params))
  // })

  app.post('/comment', async (req, res) => {
    const params = CommentQueryParams.parse(req.query)
    myLog('Received Webhook for Comment Creation', params)
    await possiblyRespond(params)
    res.send(JSON.stringify(params))
  })

  app.listen(port, () => {
    myLog(`⚡️[server]: Server is running at http://localhost:${port}`)
  })
}

runWebserver()
