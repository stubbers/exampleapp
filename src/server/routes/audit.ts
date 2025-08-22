import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { PrismaClient, Prisma } from '@prisma/client'
import { authenticateToken, requireAdmin } from '../middleware/auth'
import { injectAttack } from '../services/auditSimulator'

const audit = new Hono()
const prisma = new PrismaClient()

// Apply authentication middleware to all routes
audit.use('*', authenticateToken, requireAdmin)

audit.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '50')
    const skip = (page - 1) * limit

    const { eventType, userId, fileId, startDate, endDate } = c.req.query()

    const where: Prisma.AuditLogWhereInput = {}

    if (eventType && typeof eventType === 'string') {
      where.eventType = eventType
    }
    if (userId && typeof userId === 'string') {
      where.userId = userId
    }
    if (fileId && typeof fileId === 'string') {
      where.fileId = fileId
    }
    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) {
        where.timestamp.gte = new Date(startDate as string)
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate as string)
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: true,
          file: { include: { owner: true } }
        },
        orderBy: { timestamp: 'desc' }
      }),
      prisma.auditLog.count({ where })
    ])

    return c.json({
      success: true,
      data: {
        data: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Get audit logs error:', error)
    throw new HTTPException(500, { message: 'Internal server error' })
  }
})

audit.get('/recent-count', async (c) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    const count = await prisma.auditLog.count({
      where: {
        timestamp: {
          gte: fiveMinutesAgo
        }
      }
    })
    
    return c.json({
      success: true,
      data: { count }
    })
  } catch (error) {
    console.error('Get recent logs count error:', error)
    throw new HTTPException(500, { message: 'Internal server error' })
  }
})

audit.post('/inject-attack', async (c) => {
  try {
    const result = await injectAttack()
    return c.json({
      success: result.success,
      data: { message: result.message }
    })
  } catch (error) {
    console.error('Inject attack error:', error)
    throw new HTTPException(500, { message: 'Internal server error' })
  }
})

export default audit