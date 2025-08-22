import { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface AuthUser {
  id: string
  email: string
  role: string
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser
  }
}

export const authenticateToken = async (c: Context, next: Next) => {
  const authHeader = c.req.header('authorization')
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    throw new HTTPException(401, { message: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, active: true }
    })

    if (!user || !user.active) {
      throw new HTTPException(401, { message: 'Invalid or inactive user' })
    }

    c.set('user', user)
    await next()
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(403, { message: 'Invalid token' })
  }
}

export const requireAdmin = async (c: Context, next: Next) => {
  const user = c.get('user')
  
  if (!user) {
    throw new HTTPException(401, { message: 'Authentication required' })
  }

  if (user.role !== 'admin' && user.role !== 'superadmin') {
    throw new HTTPException(403, { message: 'Admin access required' })
  }

  await next()
}