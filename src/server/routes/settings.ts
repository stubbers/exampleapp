import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { PrismaClient, Prisma } from '@prisma/client'
import { authenticateToken, requireAdmin } from '../middleware/auth'

const settings = new Hono()
const prisma = new PrismaClient()

// Public endpoint
settings.get('/', async (c) => {
  try {
    let settingsData = await prisma.globalSettings.findFirst({
      where: { id: 1 }
    })

    if (!settingsData) {
      settingsData = await prisma.globalSettings.create({
        data: {
          allowedIpRanges: '[]',
          forceIdpLogin: false,
          sharingLevel: 'allowPasswords'
        }
      })
    }

    const formattedSettings = {
      id: settingsData.id,
      allowedIpRanges: JSON.parse(settingsData.allowedIpRanges),
      forceIdpLogin: settingsData.forceIdpLogin,
      sharingLevel: settingsData.sharingLevel,
      createdAt: settingsData.createdAt.toISOString(),
      updatedAt: settingsData.updatedAt.toISOString()
    }

    return c.json({
      success: true,
      data: formattedSettings
    })
  } catch (error) {
    console.error('Get settings error:', error)
    throw new HTTPException(500, { message: 'Internal server error' })
  }
})

// Protected routes
settings.use('*', authenticateToken, requireAdmin)

settings.put('/', async (c) => {
  try {
    const body = await c.req.json()
    const { allowedIpRanges, forceIdpLogin, sharingLevel } = body

    const updateData: Prisma.GlobalSettingsUpdateInput = {}

    if (allowedIpRanges !== undefined) {
      updateData.allowedIpRanges = JSON.stringify(allowedIpRanges)
    }
    if (typeof forceIdpLogin === 'boolean') {
      updateData.forceIdpLogin = forceIdpLogin
    }
    if (sharingLevel) {
      updateData.sharingLevel = sharingLevel
    }

    const settingsData = await prisma.globalSettings.upsert({
      where: { id: 1 },
      update: updateData,
      create: {
        allowedIpRanges: JSON.stringify(allowedIpRanges || []),
        forceIdpLogin: forceIdpLogin || false,
        sharingLevel: sharingLevel || 'allowPasswords'
      }
    })

    const formattedSettings = {
      id: settingsData.id,
      allowedIpRanges: JSON.parse(settingsData.allowedIpRanges),
      forceIdpLogin: settingsData.forceIdpLogin,
      sharingLevel: settingsData.sharingLevel,
      createdAt: settingsData.createdAt.toISOString(),
      updatedAt: settingsData.updatedAt.toISOString()
    }

    return c.json({
      success: true,
      data: formattedSettings
    })
  } catch (error) {
    console.error('Update settings error:', error)
    throw new HTTPException(500, { message: 'Internal server error' })
  }
})

export default settings