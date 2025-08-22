import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
// Rate limiting will be handled differently in Hono
import { serveStatic } from '@hono/node-server/serve-static'
import { serve } from '@hono/node-server'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { PrismaClient } from '@prisma/client'

import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import fileRoutes from './routes/files.js'
import auditRoutes from './routes/audit.js'
import settingsRoutes from './routes/settings.js'
import { setupSwagger } from './swagger.js'
import { startAuditSimulator } from './services/auditSimulator.js'

dotenv.config()

const app = new Hono()
const prisma = new PrismaClient()
const PORT = parseInt(process.env.PORT || '3001')

// Configure security and middleware
app.use('*', cors())
app.use('*', secureHeaders())

// Custom headers middleware
app.use('*', async (c, next) => {
  await next()
  c.res.headers.set('X-Frame-Options', 'SAMEORIGIN')
  c.res.headers.set('X-Content-Type-Options', 'nosniff')
})

// Setup API routes first
app.route('/api/auth', authRoutes)
app.route('/api/users', userRoutes)
app.route('/api/files', fileRoutes)
app.route('/api/audit-logs', auditRoutes)
app.route('/api/settings', settingsRoutes)

app.get('/health', (c) => {
  return c.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Setup Swagger docs (must be before static files)
setupSwagger(app)

// Serve static files in both development and production
const isDev = process.env.NODE_ENV !== 'production'
const __dirname = path.dirname(new URL(import.meta.url).pathname)
const staticPath = isDev 
  ? path.join(process.cwd(), 'dist/client')  // Development with tsx
  : path.join(__dirname, '../client')        // Production build

// Serve static files except for API routes
app.use('*', async (c, next) => {
  const path = c.req.path
  // Skip static serving for API and docs routes
  if (path.startsWith('/api') || path.startsWith('/health') || path.startsWith('/api-docs')) {
    await next()
    return
  }
  
  return serveStatic({ root: staticPath, index: '' })(c, next)
})

// Catch-all handler: send back React app with dynamic base URL
app.get('*', async (c) => {
  const htmlPath = path.join(staticPath, 'index.html')
  
  try {
    const data = fs.readFileSync(htmlPath, 'utf8')
    
    // Get the protocol and host from the request
    const protocol = c.req.header('X-Forwarded-Proto') || 'http'
    const host = c.req.header('Host')
    const baseUrl = `${protocol}://${host}`
    
    // Inject base tag to ensure all relative URLs use HTTP
    const modifiedHtml = data.replace(
      '<head>',
      `<head>\n    <base href="${baseUrl}/">`
    )
    
    c.header('Content-Type', 'text/html')
    return c.body(modifiedHtml)
  } catch {
    return c.text('Error loading page', 500)
  }
})

async function startServer() {
  try {
    await prisma.$connect()
    console.log('Database connected successfully')

    if (process.env.SEED === 'true') {
      const { seedDatabase } = await import('./seed.js')
      await seedDatabase()
      console.log('Database seeded successfully')
    }

    startAuditSimulator()
    console.log('Audit simulator started')

    serve({
      fetch: app.fetch,
      port: PORT,
      hostname: '0.0.0.0'
    })
    
    console.log(`Server running on port ${PORT}`)
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`)
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