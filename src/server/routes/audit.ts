import express from 'express'
import { PrismaClient, Prisma } from '@prisma/client'
import type { AuditLog, ApiResponse, PaginatedResponse, EventType, UserRole, FileType } from '@/shared/types'
import { authenticateToken, requireAdmin } from '../middleware/auth'
import { injectAttack } from '../services/auditSimulator'

const router = express.Router()
const prisma = new PrismaClient()

// Apply authentication middleware to all routes
router.use(authenticateToken)
router.use(requireAdmin)

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     summary: Get audit logs with filtering
 *     description: Retrieve a paginated and filterable list of audit log entries. Includes related user and file information. Requires admin authentication.
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: eventType
 *         in: query
 *         description: Filter by event type
 *         required: false
 *         schema:
 *           $ref: '#/components/schemas/EventType'
 *         example: "login"
 *       - name: userId
 *         in: query
 *         description: Filter by user ID
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *       - name: fileId
 *         in: query
 *         description: Filter by file ID
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "550e8400-e29b-41d4-a716-446655440001"
 *       - name: startDate
 *         in: query
 *         description: Filter events after this date
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *         example: "2024-01-01T00:00:00.000Z"
 *       - name: endDate
 *         in: query
 *         description: Filter events before this date
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *         example: "2024-01-31T23:59:59.999Z"
 *     responses:
 *       200:
 *         description: Successfully retrieved audit logs
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       allOf:
 *                         - $ref: '#/components/schemas/PaginatedResponse'
 *                         - type: object
 *                           properties:
 *                             data:
 *                               type: array
 *                               items:
 *                                 $ref: '#/components/schemas/AuditLog'
 *             example:
 *               success: true
 *               data:
 *                 data:
 *                   - id: "550e8400-e29b-41d4-a716-446655440002"
 *                     timestamp: "2024-01-15T10:30:00.000Z"
 *                     eventType: "login"
 *                     userId: "550e8400-e29b-41d4-a716-446655440000"
 *                     fileId: null
 *                     ipAddress: "203.1.1.100"
 *                     userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
 *                     details: "Successful login"
 *                     user:
 *                       id: "550e8400-e29b-41d4-a716-446655440000"
 *                       firstName: "John"
 *                       lastName: "Doe"
 *                       email: "john.doe@exampleapp.com"
 *                       role: "admin"
 *                       mfaEnabled: true
 *                       allowLocalLogin: true
 *                       allowIdpLogin: false
 *                       active: true
 *                       createdAt: "2024-01-15T10:30:00.000Z"
 *                       updatedAt: "2024-01-15T10:30:00.000Z"
 *                 pagination:
 *                   page: 1
 *                   limit: 50
 *                   total: 250
 *                   totalPages: 5
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const skip = (page - 1) * limit

    const { eventType, userId, fileId, startDate, endDate } = req.query

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
          file: {
            include: {
              owner: true
            }
          }
        },
        orderBy: { timestamp: 'desc' }
      }),
      prisma.auditLog.count({ where })
    ])

    const formattedLogs: AuditLog[] = logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      eventType: log.eventType as EventType,
      userId: log.userId,
      fileId: log.fileId,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      details: log.details,
      user: log.user ? {
        id: log.user.id,
        firstName: log.user.firstName,
        lastName: log.user.lastName,
        email: log.user.email,
        role: log.user.role as UserRole,
        mfaEnabled: log.user.mfaEnabled,
        allowLocalLogin: log.user.allowLocalLogin,
        allowIdpLogin: log.user.allowIdpLogin,
        active: log.user.active,
        createdAt: log.user.createdAt.toISOString(),
        updatedAt: log.user.updatedAt.toISOString()
      } : undefined,
      file: log.file ? {
        id: log.file.id,
        ownerId: log.file.ownerId,
        fileName: log.file.fileName,
        fileType: log.file.fileType as FileType,
        hasPassword: log.file.hasPassword,
        expiryDate: log.file.expiryDate?.toISOString() || null,
        active: log.file.active,
        createdAt: log.file.createdAt.toISOString(),
        updatedAt: log.file.updatedAt.toISOString(),
        owner: log.file.owner ? {
          id: log.file.owner.id,
          firstName: log.file.owner.firstName,
          lastName: log.file.owner.lastName,
          email: log.file.owner.email,
          role: log.file.owner.role as UserRole,
          mfaEnabled: log.file.owner.mfaEnabled,
          allowLocalLogin: log.file.owner.allowLocalLogin,
          allowIdpLogin: log.file.owner.allowIdpLogin,
          active: log.file.owner.active,
          createdAt: log.file.owner.createdAt.toISOString(),
          updatedAt: log.file.owner.updatedAt.toISOString()
        } : undefined
      } : undefined
    }))

    const response: ApiResponse<PaginatedResponse<AuditLog>> = {
      success: true,
      data: {
        data: formattedLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    }

    res.json(response)
  } catch (error) {
    console.error('Get audit logs error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse)
  }
})

/**
 * @swagger
 * /api/audit-logs/inject-attack:
 *   post:
 *     summary: Inject simulated attack events
 *     description: Simulates a coordinated attack by generating multiple download events from a single IP address over 50 seconds to demonstrate attack pattern detection. This is for security testing purposes. Requires admin authentication.
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attack simulation initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                           example: "Attack simulation started"
 *             example:
 *               success: true
 *               data:
 *                 message: "Attack simulation started"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/inject-attack', async (_req, res) => {
  try {
    const result = await injectAttack()
    
    const response: ApiResponse = {
      success: result.success,
      data: { message: result.message }
    }
    
    res.json(response)
  } catch (error) {
    console.error('Inject attack error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse)
  }
})

export default router