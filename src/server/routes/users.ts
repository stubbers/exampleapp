import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, requireAdmin } from '../middleware/auth'
import type { User, ApiResponse, PaginatedResponse, UserRole } from '@/shared/types'

const router = express.Router()
const prisma = new PrismaClient()

// Apply authentication middleware to all routes
router.use(authenticateToken)
router.use(requireAdmin)

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users with pagination
 *     description: Retrieve a paginated list of all users in the system. Requires admin authentication.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Successfully retrieved users list
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
 *                                 $ref: '#/components/schemas/User'
 *             example:
 *               success: true
 *               data:
 *                 data:
 *                   - id: "550e8400-e29b-41d4-a716-446655440000"
 *                     firstName: "John"
 *                     lastName: "Doe"
 *                     email: "john.doe@exampleapp.com"
 *                     role: "admin"
 *                     mfaEnabled: true
 *                     allowLocalLogin: true
 *                     allowIdpLogin: false
 *                     active: true
 *                     createdAt: "2024-01-15T10:30:00.000Z"
 *                     updatedAt: "2024-01-15T10:30:00.000Z"
 *                 pagination:
 *                   page: 1
 *                   limit: 50
 *                   total: 150
 *                   totalPages: 3
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

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count()
    ])

    const formattedUsers: User[] = users.map(user => ({
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

    res.json(response)
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse)
  }
})

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve detailed information about a specific user by their ID. Requires admin authentication.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Successfully retrieved user details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *             example:
 *               success: true
 *               data:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 firstName: "John"
 *                 lastName: "Doe"
 *                 email: "john.doe@exampleapp.com"
 *                 role: "admin"
 *                 mfaEnabled: true
 *                 allowLocalLogin: true
 *                 allowIdpLogin: false
 *                 active: true
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse)
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

    res.json({
      success: true,
      data: formattedUser
    } as ApiResponse<User>)
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse)
  }
})

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user account. Email is auto-generated as firstname.lastname@exampleapp.com. Requires admin authentication.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *           example:
 *             firstName: "Jane"
 *             lastName: "Smith"
 *             role: "user"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *             example:
 *               success: true
 *               data:
 *                 id: "550e8400-e29b-41d4-a716-446655440001"
 *                 firstName: "Jane"
 *                 lastName: "Smith"
 *                 email: "jane.smith@exampleapp.com"
 *                 role: "user"
 *                 mfaEnabled: false
 *                 allowLocalLogin: true
 *                 allowIdpLogin: false
 *                 active: true
 *                 createdAt: "2024-01-15T11:00:00.000Z"
 *                 updatedAt: "2024-01-15T11:00:00.000Z"
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
    const { firstName, lastName, role } = req.body

    if (!firstName || !lastName || !role) {
      return res.status(400).json({
        success: false,
        error: 'firstName, lastName, and role are required'
      } as ApiResponse)
    }

    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@exampleapp.com`

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      } as ApiResponse)
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

    res.status(201).json({
      success: true,
      data: formattedUser
    } as ApiResponse<User>)
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse)
  }
})

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user settings
 *     description: Update user authentication and access settings. Only specified fields will be updated. Requires admin authentication.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *           example:
 *             mfaEnabled: true
 *             allowLocalLogin: false
 *             allowIdpLogin: true
 *             active: true
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *             example:
 *               success: true
 *               data:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 firstName: "John"
 *                 lastName: "Doe"
 *                 email: "john.doe@exampleapp.com"
 *                 role: "admin"
 *                 mfaEnabled: true
 *                 allowLocalLogin: false
 *                 allowIdpLogin: true
 *                 active: true
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T11:15:00.000Z"
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
    const { mfaEnabled, allowLocalLogin, allowIdpLogin, active } = req.body

    const user = await prisma.user.update({
      where: { id: req.params.id },
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

    res.json({
      success: true,
      data: formattedUser
    } as ApiResponse<User>)
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse)
  }
})

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Permanently delete a user account. This will cascade delete all associated file sharing links and audit logs. Requires admin authentication.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *                           example: "User deleted successfully"
 *             example:
 *               success: true
 *               data:
 *                 message: "User deleted successfully"
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
    await prisma.user.delete({
      where: { id: req.params.id }
    })

    res.json({
      success: true,
      data: { message: 'User deleted successfully' }
    } as ApiResponse)
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse)
  }
})

export default router