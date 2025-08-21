import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, requireAdmin } from '../middleware/auth'
import type { FileSharingLink, ApiResponse, PaginatedResponse, FileType, UserRole } from '@/shared/types'

const router = express.Router()
const prisma = new PrismaClient()

/**
 * @swagger
 * /api/files:
 *   get:
 *     summary: Get all file sharing links with pagination
 *     description: Retrieve a paginated list of file sharing links. Can be filtered by owner. Public endpoint (no authentication required).
 *     tags: [Files]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: ownerId
 *         in: query
 *         description: Filter files by owner ID
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Successfully retrieved file sharing links
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
 *                                 $ref: '#/components/schemas/FileSharingLink'
 *             example:
 *               success: true
 *               data:
 *                 data:
 *                   - id: "550e8400-e29b-41d4-a716-446655440001"
 *                     ownerId: "550e8400-e29b-41d4-a716-446655440000"
 *                     fileName: "document_a1b2c3d4.pdf"
 *                     fileType: "pdf"
 *                     hasPassword: true
 *                     expiryDate: "2024-12-31T23:59:59.000Z"
 *                     active: true
 *                     createdAt: "2024-01-15T10:30:00.000Z"
 *                     updatedAt: "2024-01-15T10:30:00.000Z"
 *                     owner:
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
 *                   total: 75
 *                   totalPages: 2
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const skip = (page - 1) * limit
    const { ownerId } = req.query

    const where = ownerId ? { ownerId: ownerId as string } : {}

    const [files, total] = await Promise.all([
      prisma.fileSharingLink.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.fileSharingLink.count({ where })
    ])

    const formattedFiles: FileSharingLink[] = files.map(file => ({
      id: file.id,
      ownerId: file.ownerId,
      fileName: file.fileName,
      fileType: file.fileType as FileType,
      hasPassword: file.hasPassword,
      expiryDate: file.expiryDate?.toISOString() || null,
      active: file.active,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
      owner: file.owner ? {
        id: file.owner.id,
        firstName: file.owner.firstName,
        lastName: file.owner.lastName,
        email: file.owner.email,
        role: file.owner.role as UserRole,
        mfaEnabled: file.owner.mfaEnabled,
        allowLocalLogin: file.owner.allowLocalLogin,
        allowIdpLogin: file.owner.allowIdpLogin,
        active: file.owner.active,
        createdAt: file.owner.createdAt.toISOString(),
        updatedAt: file.owner.updatedAt.toISOString()
      } : undefined
    }))

    const response: ApiResponse<PaginatedResponse<FileSharingLink>> = {
      success: true,
      data: {
        data: formattedFiles,
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
    console.error('Get files error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse)
  }
})

/**
 * @swagger
 * /api/files/{id}:
 *   get:
 *     summary: Get file sharing link by ID
 *     description: Retrieve detailed information about a specific file sharing link by its ID. Includes owner information. Public endpoint (no authentication required).
 *     tags: [Files]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Successfully retrieved file sharing link details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FileSharingLink'
 *             example:
 *               success: true
 *               data:
 *                 id: "550e8400-e29b-41d4-a716-446655440001"
 *                 ownerId: "550e8400-e29b-41d4-a716-446655440000"
 *                 fileName: "document_a1b2c3d4.pdf"
 *                 fileType: "pdf"
 *                 hasPassword: true
 *                 expiryDate: "2024-12-31T23:59:59.000Z"
 *                 active: true
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *                 owner:
 *                   id: "550e8400-e29b-41d4-a716-446655440000"
 *                   firstName: "John"
 *                   lastName: "Doe"
 *                   email: "john.doe@exampleapp.com"
 *                   role: "admin"
 *                   mfaEnabled: true
 *                   allowLocalLogin: true
 *                   allowIdpLogin: false
 *                   active: true
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-15T10:30:00.000Z"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', async (req, res) => {
  try {
    const file = await prisma.fileSharingLink.findUnique({
      where: { id: req.params.id },
      include: { owner: true }
    })

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      } as ApiResponse)
    }

    const formattedFile: FileSharingLink = {
      id: file.id,
      ownerId: file.ownerId,
      fileName: file.fileName,
      fileType: file.fileType as FileType,
      hasPassword: file.hasPassword,
      expiryDate: file.expiryDate?.toISOString() || null,
      active: file.active,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
      owner: file.owner ? {
        id: file.owner.id,
        firstName: file.owner.firstName,
        lastName: file.owner.lastName,
        email: file.owner.email,
        role: file.owner.role as UserRole,
        mfaEnabled: file.owner.mfaEnabled,
        allowLocalLogin: file.owner.allowLocalLogin,
        allowIdpLogin: file.owner.allowIdpLogin,
        active: file.owner.active,
        createdAt: file.owner.createdAt.toISOString(),
        updatedAt: file.owner.updatedAt.toISOString()
      } : undefined
    }

    res.json({
      success: true,
      data: formattedFile
    } as ApiResponse<FileSharingLink>)
  } catch (error) {
    console.error('Get file error:', error)
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
 * /api/files:
 *   post:
 *     summary: Create a new file sharing link
 *     description: Create a new file sharing link for simulated file sharing. Requires admin authentication.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFileSharingLinkRequest'
 *           example:
 *             ownerId: "550e8400-e29b-41d4-a716-446655440000"
 *             fileName: "important_document.pdf"
 *             fileType: "pdf"
 *             hasPassword: true
 *             expiryDate: "2024-12-31T23:59:59.000Z"
 *     responses:
 *       201:
 *         description: File sharing link created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FileSharingLink'
 *             example:
 *               success: true
 *               data:
 *                 id: "550e8400-e29b-41d4-a716-446655440002"
 *                 ownerId: "550e8400-e29b-41d4-a716-446655440000"
 *                 fileName: "important_document.pdf"
 *                 fileType: "pdf"
 *                 hasPassword: true
 *                 expiryDate: "2024-12-31T23:59:59.000Z"
 *                 active: true
 *                 createdAt: "2024-01-15T12:00:00.000Z"
 *                 updatedAt: "2024-01-15T12:00:00.000Z"
 *                 owner:
 *                   id: "550e8400-e29b-41d4-a716-446655440000"
 *                   firstName: "John"
 *                   lastName: "Doe"
 *                   email: "john.doe@exampleapp.com"
 *                   role: "admin"
 *                   mfaEnabled: true
 *                   allowLocalLogin: true
 *                   allowIdpLogin: false
 *                   active: true
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-15T10:30:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', async (req, res) => {
  try {
    const { ownerId, fileName, fileType, hasPassword, expiryDate } = req.body

    if (!ownerId || !fileName || !fileType) {
      return res.status(400).json({
        success: false,
        error: 'ownerId, fileName, and fileType are required'
      } as ApiResponse)
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

    const formattedFile: FileSharingLink = {
      id: file.id,
      ownerId: file.ownerId,
      fileName: file.fileName,
      fileType: file.fileType as FileType,
      hasPassword: file.hasPassword,
      expiryDate: file.expiryDate?.toISOString() || null,
      active: file.active,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
      owner: file.owner ? {
        id: file.owner.id,
        firstName: file.owner.firstName,
        lastName: file.owner.lastName,
        email: file.owner.email,
        role: file.owner.role as UserRole,
        mfaEnabled: file.owner.mfaEnabled,
        allowLocalLogin: file.owner.allowLocalLogin,
        allowIdpLogin: file.owner.allowIdpLogin,
        active: file.owner.active,
        createdAt: file.owner.createdAt.toISOString(),
        updatedAt: file.owner.updatedAt.toISOString()
      } : undefined
    }

    res.status(201).json({
      success: true,
      data: formattedFile
    } as ApiResponse<FileSharingLink>)
  } catch (error) {
    console.error('Create file error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse)
  }
})

/**
 * @swagger
 * /api/files/{id}:
 *   put:
 *     summary: Update file sharing link settings
 *     description: Update file sharing link settings such as password protection, expiry date, and active status. Only specified fields will be updated. Requires admin authentication.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateFileSharingLinkRequest'
 *           example:
 *             hasPassword: false
 *             expiryDate: null
 *             active: true
 *     responses:
 *       200:
 *         description: File sharing link updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FileSharingLink'
 *             example:
 *               success: true
 *               data:
 *                 id: "550e8400-e29b-41d4-a716-446655440001"
 *                 ownerId: "550e8400-e29b-41d4-a716-446655440000"
 *                 fileName: "document_a1b2c3d4.pdf"
 *                 fileType: "pdf"
 *                 hasPassword: false
 *                 expiryDate: null
 *                 active: true
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T12:15:00.000Z"
 *                 owner:
 *                   id: "550e8400-e29b-41d4-a716-446655440000"
 *                   firstName: "John"
 *                   lastName: "Doe"
 *                   email: "john.doe@exampleapp.com"
 *                   role: "admin"
 *                   mfaEnabled: true
 *                   allowLocalLogin: true
 *                   allowIdpLogin: false
 *                   active: true
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-15T10:30:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', async (req, res) => {
  try {
    const { hasPassword, expiryDate, active } = req.body

    const file = await prisma.fileSharingLink.update({
      where: { id: req.params.id },
      data: {
        ...(typeof hasPassword === 'boolean' && { hasPassword }),
        ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
        ...(typeof active === 'boolean' && { active })
      },
      include: { owner: true }
    })

    const formattedFile: FileSharingLink = {
      id: file.id,
      ownerId: file.ownerId,
      fileName: file.fileName,
      fileType: file.fileType as FileType,
      hasPassword: file.hasPassword,
      expiryDate: file.expiryDate?.toISOString() || null,
      active: file.active,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
      owner: file.owner ? {
        id: file.owner.id,
        firstName: file.owner.firstName,
        lastName: file.owner.lastName,
        email: file.owner.email,
        role: file.owner.role as UserRole,
        mfaEnabled: file.owner.mfaEnabled,
        allowLocalLogin: file.owner.allowLocalLogin,
        allowIdpLogin: file.owner.allowIdpLogin,
        active: file.owner.active,
        createdAt: file.owner.createdAt.toISOString(),
        updatedAt: file.owner.updatedAt.toISOString()
      } : undefined
    }

    res.json({
      success: true,
      data: formattedFile
    } as ApiResponse<FileSharingLink>)
  } catch (error) {
    console.error('Update file error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse)
  }
})

/**
 * @swagger
 * /api/files/{id}:
 *   delete:
 *     summary: Delete file sharing link
 *     description: Permanently delete a file sharing link. This will also remove associated audit logs. Requires admin authentication.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: File sharing link deleted successfully
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
 *                           example: "File sharing link deleted successfully"
 *             example:
 *               success: true
 *               data:
 *                 message: "File sharing link deleted successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', async (req, res) => {
  try {
    await prisma.fileSharingLink.delete({
      where: { id: req.params.id }
    })

    res.json({
      success: true,
      data: { message: 'File sharing link deleted successfully' }
    } as ApiResponse)
  } catch (error) {
    console.error('Delete file error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse)
  }
})

export default router