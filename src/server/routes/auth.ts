import express from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import type { LoginRequest, AuthToken, ApiResponse, UserRole } from '@/shared/types'
import { authenticateToken, requireAdmin } from '../middleware/auth'

const router = express.Router()
const prisma = new PrismaClient()

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Admin login
 *     description: Authenticate using admin credentials and receive a JWT token for accessing protected endpoints. Creates admin user if it doesn't exist.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             username: "admin"
 *             password: "admin123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthToken'
 *             example:
 *               success: true
 *               data:
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   id: "550e8400-e29b-41d4-a716-446655440000"
 *                   firstName: "Admin"
 *                   lastName: "User"
 *                   email: "admin@exampleapp.com"
 *                   role: "admin"
 *                   mfaEnabled: false
 *                   allowLocalLogin: true
 *                   allowIdpLogin: false
 *                   active: true
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-15T10:30:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password }: LoginRequest = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      } as ApiResponse)
    }

    const adminUsername = process.env.ADMIN_USERNAME || 'admin'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

    if (username !== adminUsername || password !== adminPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      } as ApiResponse)
    }

    let adminUser = await prisma.user.findFirst({
      where: { 
        email: 'admin@exampleapp.com',
        role: 'admin'
      }
    })

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@exampleapp.com',
          role: 'admin',
          mfaEnabled: false,
          allowLocalLogin: true,
          allowIdpLogin: false,
          active: true
        }
      })
    }

    const token = jwt.sign(
      { userId: adminUser.id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )

    const response: ApiResponse<AuthToken> = {
      success: true,
      data: {
        token,
        user: {
          id: adminUser.id,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          email: adminUser.email,
          role: adminUser.role as UserRole,
          mfaEnabled: adminUser.mfaEnabled,
          allowLocalLogin: adminUser.allowLocalLogin,
          allowIdpLogin: adminUser.allowIdpLogin,
          active: adminUser.active,
          createdAt: adminUser.createdAt.toISOString(),
          updatedAt: adminUser.updatedAt.toISOString()
        }
      }
    }

    res.json(response)
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse)
  }
})

/**
 * @swagger
 * /api/auth/api-token:
 *   get:
 *     summary: Generate long-lived API token
 *     description: Generate a long-lived API bearer token (30 days) for external integrations and programmatic access. Requires admin authentication.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: API token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       required: ['token', 'expiresAt']
 *                       properties:
 *                         token:
 *                           type: string
 *                           description: 'Long-lived JWT token for API access'
 *                           example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *                         expiresAt:
 *                           type: string
 *                           format: date-time
 *                           description: 'When the token expires'
 *                           example: '2024-02-15T10:30:00.000Z'
 *             example:
 *               success: true
 *               data:
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 expiresAt: "2024-02-15T10:30:00.000Z"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/api-token', authenticateToken, requireAdmin, async (_req, res) => {
  try {
    // Get admin user from database
    let adminUser = await prisma.user.findFirst({
      where: { 
        email: 'admin@exampleapp.com',
        role: 'admin'
      }
    })

    if (!adminUser) {
      return res.status(404).json({
        success: false,
        error: 'Admin user not found'
      } as ApiResponse)
    }

    // Generate a long-lived API token (30 days)
    const apiToken = jwt.sign(
      { 
        userId: adminUser.id, 
        email: adminUser.email, 
        role: adminUser.role,
        tokenType: 'api'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    )

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const response: ApiResponse<{ token: string; expiresAt: string }> = {
      success: true,
      data: {
        token: apiToken,
        expiresAt: expiresAt.toISOString()
      }
    }

    res.json(response)
  } catch (error) {
    console.error('API token generation error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse)
  }
})

export default router