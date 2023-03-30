import express from 'express'
import { z } from 'zod'

const CommentQueryParams = z.object({
    pr: z.coerce.number(),
    comment: z.coerce.number(),
})

function runWebserver() {
    const app = express()
    const port = process.env.PORT;

    app.get('/', (req, res) => {
        res.send(`Call to root with query ${req.query}`);
    })

    app.get("/comment", (req, res) => {
        const params = CommentQueryParams.parse(req.query)
        console.log(params)
        res.send(JSON.stringify(params))
    })

    app.listen(port, () => {
        console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
    });
}

runWebserver()