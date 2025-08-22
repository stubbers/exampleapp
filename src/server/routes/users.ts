import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, requireAdmin } from '../middleware/auth'
import type { User, ApiResponse, PaginatedResponse, UserRole } from '@/shared/types'

const users = new Hono()
const prisma = new PrismaClient()

// Apply authentication middleware to all routes
users.use('*', authenticateToken, requireAdmin)

users.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '50')
    const skip = (page - 1) * limit

    const [userList, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count()
    ])

    const formattedUsers: User[] = userList.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role as UserRole,
      mfaEnabled: user.mfaEnabled,
      allowLocalLogin: user.allowLocalLogin,
      allowIdpLogin: user.allowIdpLogin,
      active: user.active,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }))

    const response: ApiResponse<PaginatedResponse<User>> = {
      success: true,
      data: {
        data: formattedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    }

    return c.json(response)
  } catch (error) {
    console.error('Get users error:', error)
    throw new HTTPException(500, { message: 'Internal server error' })
  }
})

users.get('/:id', async (c) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: c.req.param('id') }
    })

    if (!user) {
      throw new HTTPException(404, { message: 'User not found' })
    }

    const formattedUser: User = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role as UserRole,
      mfaEnabled: user.mfaEnabled,
      allowLocalLogin: user.allowLocalLogin,
      allowIdpLogin: user.allowIdpLogin,
      active: user.active,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }

    return c.json({
      success: true,
      data: formattedUser
    } as ApiResponse<User>)
  } catch (error) {
    if (error instanceof HTTPException) throw error
    console.error('Get user error:', error)
    throw new HTTPException(500, { message: 'Internal server error' })
  }
})

users.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { firstName, lastName, role } = body

    if (!firstName || !lastName || !role) {
      throw new HTTPException(400, { message: 'firstName, lastName, and role are required' })
    }

    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@exampleapp.com`

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw new HTTPException(400, { message: 'User with this email already exists' })
    }

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        role,
        mfaEnabled: false,
        allowLocalLogin: true,
        allowIdpLogin: false,
        active: true
      }
    })

    const formattedUser: User = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role as UserRole,
      mfaEnabled: user.mfaEnabled,
      allowLocalLogin: user.allowLocalLogin,
      allowIdpLogin: user.allowIdpLogin,
      active: user.active,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }

    return c.json({
      success: true,
      data: formattedUser
    } as ApiResponse<User>, 201)
  } catch (error) {
    if (error instanceof HTTPException) throw error
    console.error('Create user error:', error)
    throw new HTTPException(500, { message: 'Internal server error' })
  }
})

users.put('/:id', async (c) => {
  try {
    const body = await c.req.json()
    const { mfaEnabled, allowLocalLogin, allowIdpLogin, active } = body

    const user = await prisma.user.update({
      where: { id: c.req.param('id') },
      data: {
        ...(typeof mfaEnabled === 'boolean' && { mfaEnabled }),
        ...(typeof allowLocalLogin === 'boolean' && { allowLocalLogin }),
        ...(typeof allowIdpLogin === 'boolean' && { allowIdpLogin }),
        ...(typeof active === 'boolean' && { active })
      }
    })

    const formattedUser: User = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role as UserRole,
      mfaEnabled: user.mfaEnabled,
      allowLocalLogin: user.allowLocalLogin,
      allowIdpLogin: user.allowIdpLogin,
      active: user.active,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }

    return c.json({
      success: true,
      data: formattedUser
    } as ApiResponse<User>)
  } catch (error) {
    if (error instanceof HTTPException) throw error
    console.error('Update user error:', error)
    throw new HTTPException(500, { message: 'Internal server error' })
  }
})

users.delete('/:id', async (c) => {
  try {
    await prisma.user.delete({
      where: { id: c.req.param('id') }
    })

    return c.json({
      success: true,
      data: { message: 'User deleted successfully' }
    } as ApiResponse)
  } catch (error) {
    console.error('Delete user error:', error)
    throw new HTTPException(500, { message: 'Internal server error' })
  }
})

export default users