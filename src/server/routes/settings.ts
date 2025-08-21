import express from 'express'
import { PrismaClient, Prisma } from '@prisma/client'
import { authenticateToken, requireAdmin } from '../middleware/auth'
import type { GlobalSettings, ApiResponse, SharingLevel } from '@/shared/types'

const router = express.Router()
const prisma = new PrismaClient()

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get global application settings
 *     description: Retrieve the current global settings for the application. Creates default settings if none exist. Public endpoint (no authentication required).
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Successfully retrieved global settings
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/GlobalSettings'
 *             example:
 *               success: true
 *               data:
 *                 id: 1
 *                 allowedIpRanges: ["203.1.0.0/16", "10.0.0.0/8"]
 *                 forceIdpLogin: false
 *                 sharingLevel: "allowPasswords"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', async (_req, res) => {
  try {
    let settings = await prisma.globalSettings.findFirst({
      where: { id: 1 }
    })

    if (!settings) {
      settings = await prisma.globalSettings.create({
        data: {
          allowedIpRanges: '[]',
          forceIdpLogin: false,
          sharingLevel: 'allowPasswords'
        }
      })
    }

    const formattedSettings: GlobalSettings = {
      id: settings.id,
      allowedIpRanges: JSON.parse(settings.allowedIpRanges),
      forceIdpLogin: settings.forceIdpLogin,
      sharingLevel: settings.sharingLevel as SharingLevel,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString()
    }

    res.json({
      success: true,
      data: formattedSettings
    } as ApiResponse<GlobalSettings>)
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse)
  }
})

router.use(authenticateToken)
router.use(requireAdmin)

/**
 * @swagger
 * /api/settings:
 *   put:
 *     summary: Update global application settings
 *     description: Update global settings for IP restrictions, IdP enforcement, and file sharing policies. Only specified fields will be updated. Requires admin authentication.
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateGlobalSettingsRequest'
 *           example:
 *             allowedIpRanges: ["203.1.0.0/16", "192.168.1.0/24"]
 *             forceIdpLogin: true
 *             sharingLevel: "forcePasswords"
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/GlobalSettings'
 *             example:
 *               success: true
 *               data:
 *                 id: 1
 *                 allowedIpRanges: ["203.1.0.0/16", "192.168.1.0/24"]
 *                 forceIdpLogin: true
 *                 sharingLevel: "forcePasswords"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T12:30:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/', async (req, res) => {
  try {
    const { allowedIpRanges, forceIdpLogin, sharingLevel } = req.body

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

    const settings = await prisma.globalSettings.upsert({
      where: { id: 1 },
      update: updateData,
      create: {
        allowedIpRanges: JSON.stringify(allowedIpRanges || []),
        forceIdpLogin: forceIdpLogin || false,
        sharingLevel: sharingLevel || 'allowPasswords'
      }
    })

    const formattedSettings: GlobalSettings = {
      id: settings.id,
      allowedIpRanges: JSON.parse(settings.allowedIpRanges),
      forceIdpLogin: settings.forceIdpLogin,
      sharingLevel: settings.sharingLevel as SharingLevel,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString()
    }

    res.json({
      success: true,
      data: formattedSettings
    } as ApiResponse<GlobalSettings>)
  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse)
  }
})

export default router