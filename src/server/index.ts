import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { PrismaClient } from '@prisma/client'

import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import fileRoutes from './routes/files'
import auditRoutes from './routes/audit'
import settingsRoutes from './routes/settings'
import { setupSwagger } from './swagger'
import { startAuditSimulator } from './services/auditSimulator'

dotenv.config()

const app = express()
const prisma = new PrismaClient()
const PORT = parseInt(process.env.PORT || '3001')

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again later.',
})

// Configure helmet with relaxed security for local development
app.use(helmet({
  contentSecurityPolicy: false,  // Disable CSP that might force HTTPS
  hsts: false,                   // Disable HTTPS Strict Transport Security
  crossOriginEmbedderPolicy: false
}))
app.use(cors())
app.use(limiter)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Add headers to prevent HTTPS upgrades and mixed content issues
app.use((_req, res, next) => {
  // Remove any CSP headers that might force HTTPS
  res.removeHeader('Content-Security-Policy')
  // Explicitly allow mixed content for development
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  next()
})

setupSwagger(app)

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/files', fileRoutes)
app.use('/api/audit-logs', auditRoutes)
app.use('/api/settings', settingsRoutes)

app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Serve static files in both development and production
const isDev = process.env.NODE_ENV !== 'production'
const staticPath = isDev 
  ? path.join(__dirname, '../../dist/client')  // Development with tsx
  : path.join(__dirname, '../client')          // Production build

// Serve static files except index.html (we'll handle that in the catch-all)
app.use(express.static(staticPath, { index: false }))

// Catch-all handler: send back React app with dynamic base URL
app.get('*', (req, res) => {
  const htmlPath = path.join(staticPath, 'index.html')
  
  fs.readFile(htmlPath, 'utf8', (err: NodeJS.ErrnoException | null, data: string) => {
    if (err) {
      res.status(500).send('Error loading page')
      return
    }
    
    // Get the protocol and host from the request
    const protocol = req.get('X-Forwarded-Proto') || (req.secure ? 'https' : 'http')
    const host = req.get('Host')
    const baseUrl = `${protocol}://${host}`
    
    // Inject base tag to ensure all relative URLs use HTTP
    const modifiedHtml = data.replace(
      '<head>',
      `<head>\n    <base href="${baseUrl}/">`
    )
    
    res.setHeader('Content-Type', 'text/html')
    res.send(modifiedHtml)
  })
})

async function startServer() {
  try {
    await prisma.$connect()
    console.log('Database connected successfully')

    if (process.env.SEED === 'true') {
      const { seedDatabase } = await import('./seed')
      await seedDatabase()
      console.log('Database seeded successfully')
    }

    startAuditSimulator()
    console.log('Audit simulator started')

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`)
      console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

startServer()