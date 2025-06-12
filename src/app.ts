import express, { Request, Response, NextFunction } from 'express'
import uploadRoutes from './router'
import bodyParser from 'body-parser'

const app = express()


app.use(bodyParser.json())
app.use('/api', uploadRoutes)

// Error handling
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', error)
  res.status(500).send({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).send({
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} does not exist`
  })
})

const port = process.env.APP_PORT || 3000


app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})

export default app
