import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { Express, Request, Response, NextFunction } from 'express'

const options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'ExampleApp API',
      version: '1.0.0',
      description: 'A simulated file sharing application API for security testing and honeypot deployment',
      contact: {
        name: 'ExampleApp Security Team',
        email: 'security@exampleapp.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api',
        description: process.env.NODE_ENV === 'production' ? 'Production API' : 'Development API'
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer token for authentication'
        },
      },
      schemas: {
        UserRole: {
          type: 'string',
          enum: ['admin', 'superadmin', 'user', 'guest'],
          description: 'User role defining access permissions'
        },
        FileType: {
          type: 'string',
          enum: ['pdf', 'xlsx', 'docx', 'pptx', 'txt', 'csv', 'zip', 'jpg', 'png', 'mp4'],
          description: 'Supported file types for sharing'
        },
        EventType: {
          type: 'string',
          enum: ['login', 'download', 'failedLogin', 'failedDownload'],
          description: 'Types of events logged in audit trail'
        },
        SharingLevel: {
          type: 'string',
          enum: ['doNotAllowPasswords', 'allowPasswords', 'forcePasswords'],
          description: 'Global policy for password protection on file shares'
        },
        User: {
          type: 'object',
          required: ['id', 'firstName', 'lastName', 'email', 'role', 'mfaEnabled', 'allowLocalLogin', 'allowIdpLogin', 'active', 'createdAt', 'updatedAt'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the user',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            firstName: {
              type: 'string',
              description: 'User\'s first name',
              example: 'John',
              minLength: 1,
              maxLength: 50
            },
            lastName: {
              type: 'string',
              description: 'User\'s last name',
              example: 'Doe',
              minLength: 1,
              maxLength: 50
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User\'s email address (auto-generated as firstname.lastname@exampleapp.com)',
              example: 'john.doe@exampleapp.com'
            },
            role: {
              $ref: '#/components/schemas/UserRole'
            },
            mfaEnabled: {
              type: 'boolean',
              description: 'Whether multi-factor authentication is enabled',
              example: true
            },
            allowLocalLogin: {
              type: 'boolean',
              description: 'Whether user can log in with local credentials',
              example: true
            },
            allowIdpLogin: {
              type: 'boolean',
              description: 'Whether user can log in via identity provider',
              example: false
            },
            active: {
              type: 'boolean',
              description: 'Whether the user account is active',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the user was created',
              example: '2024-01-15T10:30:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the user was last updated',
              example: '2024-01-15T10:30:00.000Z'
            }
          }
        },
        FileSharingLink: {
          type: 'object',
          required: ['id', 'ownerId', 'fileName', 'fileType', 'hasPassword', 'active', 'createdAt', 'updatedAt'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the file sharing link',
              example: '550e8400-e29b-41d4-a716-446655440001'
            },
            ownerId: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the user who owns this file',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            fileName: {
              type: 'string',
              description: 'Name of the shared file (GUID-based for simulation)',
              example: 'document_a1b2c3d4.pdf',
              minLength: 1,
              maxLength: 255
            },
            fileType: {
              $ref: '#/components/schemas/FileType'
            },
            hasPassword: {
              type: 'boolean',
              description: 'Whether the file sharing link is password protected',
              example: true
            },
            expiryDate: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'When the sharing link expires (null for no expiry)',
              example: '2024-12-31T23:59:59.000Z'
            },
            active: {
              type: 'boolean',
              description: 'Whether the sharing link is active',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the sharing link was created',
              example: '2024-01-15T10:30:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the sharing link was last updated',
              example: '2024-01-15T10:30:00.000Z'
            },
            owner: {
              $ref: '#/components/schemas/User',
              description: 'User who owns this file (included in some responses)'
            }
          }
        },
        AuditLog: {
          type: 'object',
          required: ['id', 'timestamp', 'eventType', 'ipAddress', 'userAgent'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the audit log entry',
              example: '550e8400-e29b-41d4-a716-446655440002'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'When the event occurred',
              example: '2024-01-15T10:30:00.000Z'
            },
            eventType: {
              $ref: '#/components/schemas/EventType'
            },
            userId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: 'ID of the user involved in the event (null for anonymous events)',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            fileId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: 'ID of the file involved in the event (null for non-file events)',
              example: '550e8400-e29b-41d4-a716-446655440001'
            },
            ipAddress: {
              type: 'string',
              format: 'ipv4',
              description: 'IP address of the client (Australian ranges only in simulation)',
              example: '203.1.1.100'
            },
            userAgent: {
              type: 'string',
              description: 'Browser user agent string (Chrome/Safari only in simulation)',
              example: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            },
            details: {
              type: 'string',
              nullable: true,
              description: 'Additional details about the event',
              example: 'Login attempt from new device'
            },
            user: {
              $ref: '#/components/schemas/User',
              description: 'User involved in the event (included in some responses)'
            },
            file: {
              $ref: '#/components/schemas/FileSharingLink',
              description: 'File involved in the event (included in some responses)'
            }
          }
        },
        GlobalSettings: {
          type: 'object',
          required: ['id', 'allowedIpRanges', 'forceIdpLogin', 'sharingLevel', 'createdAt', 'updatedAt'],
          properties: {
            id: {
              type: 'integer',
              description: 'Settings ID (always 1, singleton pattern)',
              example: 1
            },
            allowedIpRanges: {
              type: 'array',
              items: {
                type: 'string',
                format: 'ipv4',
                description: 'CIDR notation IP range'
              },
              description: 'List of allowed IP ranges for access',
              example: ['203.1.0.0/16', '10.0.0.0/8']
            },
            forceIdpLogin: {
              type: 'boolean',
              description: 'Whether to force identity provider login for all users',
              example: false
            },
            sharingLevel: {
              $ref: '#/components/schemas/SharingLevel'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the settings were created',
              example: '2024-01-15T10:30:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the settings were last updated',
              example: '2024-01-15T10:30:00.000Z'
            }
          }
        },
        AuthToken: {
          type: 'object',
          required: ['token', 'user'],
          properties: {
            token: {
              type: 'string',
              description: 'JWT authentication token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            user: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Username for authentication',
              example: 'admin@exampleapp.com'
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'Password for authentication',
              example: 'securePassword123'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          required: ['success'],
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the request was successful',
              example: true
            },
            data: {
              description: 'Response data (varies by endpoint)',
              oneOf: [
                { type: 'object' },
                { type: 'array' },
                { type: 'string' },
                { type: 'number' },
                { type: 'boolean' }
              ]
            },
            error: {
              type: 'string',
              description: 'Error message (present when success is false)',
              example: 'User not found'
            }
          }
        },
        PaginatedResponse: {
          type: 'object',
          required: ['data', 'pagination'],
          properties: {
            data: {
              type: 'array',
              description: 'Array of items for the current page',
              items: {}
            },
            pagination: {
              type: 'object',
              required: ['page', 'limit', 'total', 'totalPages'],
              properties: {
                page: {
                  type: 'integer',
                  minimum: 1,
                  description: 'Current page number',
                  example: 1
                },
                limit: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 1000,
                  description: 'Number of items per page',
                  example: 50
                },
                total: {
                  type: 'integer',
                  minimum: 0,
                  description: 'Total number of items',
                  example: 150
                },
                totalPages: {
                  type: 'integer',
                  minimum: 0,
                  description: 'Total number of pages',
                  example: 3
                }
              }
            }
          }
        },
        CreateUserRequest: {
          type: 'object',
          required: ['firstName', 'lastName', 'role'],
          properties: {
            firstName: {
              type: 'string',
              minLength: 1,
              maxLength: 50,
              description: 'User\'s first name',
              example: 'John'
            },
            lastName: {
              type: 'string',
              minLength: 1,
              maxLength: 50,
              description: 'User\'s last name',
              example: 'Doe'
            },
            role: {
              $ref: '#/components/schemas/UserRole'
            }
          }
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            mfaEnabled: {
              type: 'boolean',
              description: 'Whether multi-factor authentication is enabled'
            },
            allowLocalLogin: {
              type: 'boolean',
              description: 'Whether user can log in with local credentials'
            },
            allowIdpLogin: {
              type: 'boolean',
              description: 'Whether user can log in via identity provider'
            },
            active: {
              type: 'boolean',
              description: 'Whether the user account is active'
            }
          }
        },
        CreateFileSharingLinkRequest: {
          type: 'object',
          required: ['ownerId', 'fileName', 'fileType'],
          properties: {
            ownerId: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the user who will own this file',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            fileName: {
              type: 'string',
              minLength: 1,
              maxLength: 255,
              description: 'Name of the file to be shared',
              example: 'important_document.pdf'
            },
            fileType: {
              $ref: '#/components/schemas/FileType'
            },
            hasPassword: {
              type: 'boolean',
              description: 'Whether the file sharing link should be password protected',
              example: true
            },
            expiryDate: {
              type: 'string',
              format: 'date-time',
              description: 'When the sharing link should expire (optional)',
              example: '2024-12-31T23:59:59.000Z'
            }
          }
        },
        UpdateFileSharingLinkRequest: {
          type: 'object',
          properties: {
            hasPassword: {
              type: 'boolean',
              description: 'Whether the file sharing link is password protected'
            },
            expiryDate: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'When the sharing link expires (null to remove expiry)'
            },
            active: {
              type: 'boolean',
              description: 'Whether the sharing link is active'
            }
          }
        },
        UpdateGlobalSettingsRequest: {
          type: 'object',
          properties: {
            allowedIpRanges: {
              type: 'array',
              items: {
                type: 'string',
                format: 'ipv4'
              },
              description: 'List of allowed IP ranges in CIDR notation'
            },
            forceIdpLogin: {
              type: 'boolean',
              description: 'Whether to force identity provider login'
            },
            sharingLevel: {
              $ref: '#/components/schemas/SharingLevel'
            }
          }
        },
        Error: {
          type: 'object',
          required: ['success', 'error'],
          properties: {
            success: {
              type: 'boolean',
              enum: [false],
              description: 'Always false for error responses'
            },
            error: {
              type: 'string',
              description: 'Description of the error',
              example: 'User not found'
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad Request - Invalid input parameters',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'firstName, lastName, and role are required'
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized - Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Access token required'
              }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Admin access required'
              }
            }
          }
        },
        NotFound: {
          description: 'Not Found - Resource does not exist',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'User not found'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Internal server error'
              }
            }
          }
        }
      },
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          example: 1
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 1000,
            default: 50
          },
          example: 50
        },
        IdParam: {
          name: 'id',
          in: 'path',
          description: 'Resource ID',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          example: '550e8400-e29b-41d4-a716-446655440000'
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management'
      },
      {
        name: 'Users',
        description: 'User management operations (admin only)'
      },
      {
        name: 'Files',
        description: 'File sharing link management'
      },
      {
        name: 'Audit',
        description: 'Audit log queries and analysis'
      },
      {
        name: 'Settings',
        description: 'Global application settings management'
      }
    ]
  },
  apis: ['./src/server/routes/*.ts'],
}

const specs = swaggerJsdoc(options)

export function setupSwagger(app: Express) {
  // Serve the raw JSON spec
  app.get('/api-docs.json', (req: Request, res: Response) => {
    const protocol = req.protocol
    const host = req.get('Host')
    const baseUrl = `${protocol}://${host}`
    
    const dynamicSpecs = {
      ...specs,
      servers: [
        {
          url: process.env.NODE_ENV === 'production' ? '/api' : `${baseUrl}/api`,
        },
      ],
    }
    
    res.json(dynamicSpecs)
  })

  app.use('/api-docs', swaggerUi.serve, (req: Request, res: Response, next: NextFunction) => {
    // Get the protocol and host from the request
    const protocol = req.protocol
    const host = req.get('Host')
    const baseUrl = `${protocol}://${host}`
    
    // Create a copy of specs with dynamic server URL
    const dynamicSpecs = {
      ...specs,
      servers: [
        {
          url: process.env.NODE_ENV === 'production' ? '/api' : `${baseUrl}/api`,
        },
      ],
    }
    
    return swaggerUi.setup(dynamicSpecs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'ExampleApp API Documentation'
    })(req, res, next)
  })
}