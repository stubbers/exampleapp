import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import type { LoginRequest, AuthToken, ApiResponse, UserRole } from '@/shared/types'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'

const auth = new Hono()
const prisma = new PrismaClient()

auth.post('/login', async (c) => {
  try {
    const body = await c.req.json() as LoginRequest
    const { username, password } = body

    if (!username || !password) {
      throw new HTTPException(400, { message: 'Username and password are required' })
    }

    const adminUsername = process.env.ADMIN_USERNAME || 'admin'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

    if (username !== adminUsername || password !== adminPassword) {
      throw new HTTPException(401, { message: 'Invalid credentials' })
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

    return c.json(response)
  } catch (error) {
    if (error instanceof HTTPException) throw error
    console.error('Login error:', error)
    throw new HTTPException(500, { message: 'Internal server error' })
  }
})

auth.get('/api-token', authenticateToken, requireAdmin, async (c) => {
  try {
    let adminUser = await prisma.user.findFirst({
      where: { 
        email: 'admin@exampleapp.com',
        role: 'admin'
      }
    })

    if (!adminUser) {
      throw new HTTPException(404, { message: 'Admin user not found' })
    }

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

    return c.json(response)
  } catch (error) {
    if (error instanceof HTTPException) throw error
    console.error('API token generation error:', error)
    throw new HTTPException(500, { message: 'Internal server error' })
  }
})

export default auth