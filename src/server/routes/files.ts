import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'

const files = new Hono()
const prisma = new PrismaClient()

// Public endpoints (no auth required)
files.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '50')
    const skip = (page - 1) * limit
    const ownerId = c.req.query('ownerId')

    const where = ownerId ? { ownerId } : {}

    const [fileList, total] = await Promise.all([
      prisma.fileSharingLink.findMany({
        where,
        skip,
        take: limit,
        include: { owner: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.fileSharingLink.count({ where })
    ])

    return c.json({
      success: true,
      data: {
        data: fileList,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Get files error:', error)
    throw new HTTPException(500, { message: 'Internal server error' })
  }
})

files.get('/:id', async (c) => {
  try {
    const file = await prisma.fileSharingLink.findUnique({
      where: { id: c.req.param('id') },
      include: { owner: true }
    })

    if (!file) {
      throw new HTTPException(404, { message: 'File not found' })
    }

    return c.json({ success: true, data: file })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    console.error('Get file error:', error)
    throw new HTTPException(500, { message: 'Internal server error' })
  }
})

// Protected routes (require auth)
files.use('*', authenticateToken, requireAdmin)

files.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { ownerId, fileName, fileType, hasPassword, expiryDate } = body

    if (!ownerId || !fileName || !fileType) {
      throw new HTTPException(400, { message: 'ownerId, fileName, and fileType are required' })
    }

    const file = await prisma.fileSharingLink.create({
      data: {
        ownerId,
        fileName,
        fileType,
        hasPassword: hasPassword || false,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        active: true
      },
      include: { owner: true }
    })

    return c.json({ success: true, data: file }, 201)
  } catch (error) {
    if (error instanceof HTTPException) throw error
    console.error('Create file error:', error)
    throw new HTTPException(500, { message: 'Internal server error' })
  }
})

export default files