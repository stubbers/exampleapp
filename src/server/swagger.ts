import { Hono } from 'hono'
import { swaggerUI } from '@hono/swagger-ui'

export function setupSwagger(app: Hono) {
  // Serve the raw JSON spec
  app.get('/api-docs.json', (c) => {
    const protocol = c.req.header('X-Forwarded-Proto') || 'http'
    const host = c.req.header('Host')
    const baseUrl = `${protocol}://${host}`
    
    const spec = {
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
          url: process.env.NODE_ENV === 'production' ? '/api' : `${baseUrl}/api`,
          description: process.env.NODE_ENV === 'production' ? 'Production API' : 'Development API'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT Bearer token for authentication'
          }
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
                description: "User's first name",
                example: 'John',
                minLength: 1,
                maxLength: 50
              },
              lastName: {
                type: 'string',
                description: "User's last name",
                example: 'Doe',
                minLength: 1,
                maxLength: 50
              },
              email: {
                type: 'string',
                format: 'email',
                description: "User's email address (auto-generated as firstname.lastname@exampleapp.com)",
                example: 'john.doe@exampleapp.com'
              },
              role: { $ref: '#/components/schemas/UserRole' },
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
              fileType: { $ref: '#/components/schemas/FileType' },
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
              eventType: { $ref: '#/components/schemas/EventType' },
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
              sharingLevel: { $ref: '#/components/schemas/SharingLevel' },
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
        },
        responses: {
          BadRequest: {
            description: 'Bad Request - Invalid input parameters',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
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
                schema: { $ref: '#/components/schemas/ApiResponse' },
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
                schema: { $ref: '#/components/schemas/ApiResponse' },
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
                schema: { $ref: '#/components/schemas/ApiResponse' },
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
                schema: { $ref: '#/components/schemas/ApiResponse' },
                example: {
                  success: false,
                  error: 'Internal server error'
                }
              }
            }
          }
        }
      },
      paths: {
        '/api/auth/login': {
          post: {
            summary: 'Admin login',
            description: 'Authenticate using admin credentials and receive a JWT token for accessing protected endpoints. Creates admin user if it doesn\'t exist.',
            tags: ['Authentication'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['username', 'password'],
                    properties: {
                      username: {
                        type: 'string',
                        description: 'Username for authentication',
                        example: 'admin'
                      },
                      password: {
                        type: 'string',
                        format: 'password',
                        description: 'Password for authentication',
                        example: 'admin123'
                      }
                    }
                  }
                }
              }
            },
            responses: {
              200: {
                description: 'Login successful',
                content: {
                  'application/json': {
                    schema: {
                      allOf: [
                        { $ref: '#/components/schemas/ApiResponse' },
                        {
                          type: 'object',
                          properties: {
                            data: {
                              type: 'object',
                              properties: {
                                token: {
                                  type: 'string',
                                  description: 'JWT authentication token',
                                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                                },
                                user: { $ref: '#/components/schemas/User' }
                              }
                            }
                          }
                        }
                      ]
                    }
                  }
                }
              },
              400: { $ref: '#/components/responses/BadRequest' },
              401: { $ref: '#/components/responses/Unauthorized' },
              500: { $ref: '#/components/responses/InternalServerError' }
            }
          }
        },
        '/api/auth/api-token': {
          get: {
            summary: 'Generate long-lived API token',
            description: 'Generate a long-lived API bearer token (30 days) for external integrations and programmatic access. Requires admin authentication.',
            tags: ['Authentication'],
            security: [{ bearerAuth: [] }],
            responses: {
              200: {
                description: 'API token generated successfully',
                content: {
                  'application/json': {
                    schema: {
                      allOf: [
                        { $ref: '#/components/schemas/ApiResponse' },
                        {
                          type: 'object',
                          properties: {
                            data: {
                              type: 'object',
                              required: ['token', 'expiresAt'],
                              properties: {
                                token: {
                                  type: 'string',
                                  description: 'Long-lived JWT token for API access',
                                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                                },
                                expiresAt: {
                                  type: 'string',
                                  format: 'date-time',
                                  description: 'When the token expires',
                                  example: '2024-02-15T10:30:00.000Z'
                                }
                              }
                            }
                          }
                        }
                      ]
                    }
                  }
                }
              },
              401: { $ref: '#/components/responses/Unauthorized' },
              403: { $ref: '#/components/responses/Forbidden' },
              404: { $ref: '#/components/responses/NotFound' },
              500: { $ref: '#/components/responses/InternalServerError' }
            }
          }
        },
        '/api/users': {
          get: {
            summary: 'Get all users with pagination',
            description: 'Retrieve a paginated list of all users in the system. Requires admin authentication.',
            tags: ['Users'],
            security: [{ bearerAuth: [] }],
            parameters: [
              { $ref: '#/components/parameters/PageParam' },
              { $ref: '#/components/parameters/LimitParam' }
            ],
            responses: {
              200: {
                description: 'Successfully retrieved users list',
                content: {
                  'application/json': {
                    schema: {
                      allOf: [
                        { $ref: '#/components/schemas/ApiResponse' },
                        {
                          type: 'object',
                          properties: {
                            data: {
                              allOf: [
                                { $ref: '#/components/schemas/PaginatedResponse' },
                                {
                                  type: 'object',
                                  properties: {
                                    data: {
                                      type: 'array',
                                      items: { $ref: '#/components/schemas/User' }
                                    }
                                  }
                                }
                              ]
                            }
                          }
                        }
                      ]
                    }
                  }
                }
              },
              401: { $ref: '#/components/responses/Unauthorized' },
              403: { $ref: '#/components/responses/Forbidden' },
              500: { $ref: '#/components/responses/InternalServerError' }
            }
          },
          post: {
            summary: 'Create a new user',
            description: 'Create a new user account. Email is auto-generated as firstname.lastname@exampleapp.com. Requires admin authentication.',
            tags: ['Users'],
            security: [{ bearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['firstName', 'lastName', 'role'],
                    properties: {
                      firstName: {
                        type: 'string',
                        minLength: 1,
                        maxLength: 50,
                        description: "User's first name",
                        example: 'Jane'
                      },
                      lastName: {
                        type: 'string',
                        minLength: 1,
                        maxLength: 50,
                        description: "User's last name",
                        example: 'Smith'
                      },
                      role: { $ref: '#/components/schemas/UserRole' }
                    }
                  }
                }
              }
            },
            responses: {
              201: {
                description: 'User created successfully',
                content: {
                  'application/json': {
                    schema: {
                      allOf: [
                        { $ref: '#/components/schemas/ApiResponse' },
                        {
                          type: 'object',
                          properties: {
                            data: { $ref: '#/components/schemas/User' }
                          }
                        }
                      ]
                    }
                  }
                }
              },
              400: { $ref: '#/components/responses/BadRequest' },
              401: { $ref: '#/components/responses/Unauthorized' },
              403: { $ref: '#/components/responses/Forbidden' },
              500: { $ref: '#/components/responses/InternalServerError' }
            }
          }
        },
        '/api/users/{id}': {
          get: {
            summary: 'Get user by ID',
            description: 'Retrieve detailed information about a specific user by their ID. Requires admin authentication.',
            tags: ['Users'],
            security: [{ bearerAuth: [] }],
            parameters: [{ $ref: '#/components/parameters/IdParam' }],
            responses: {
              200: {
                description: 'Successfully retrieved user details',
                content: {
                  'application/json': {
                    schema: {
                      allOf: [
                        { $ref: '#/components/schemas/ApiResponse' },
                        {
                          type: 'object',
                          properties: {
                            data: { $ref: '#/components/schemas/User' }
                          }
                        }
                      ]
                    }
                  }
                }
              },
              401: { $ref: '#/components/responses/Unauthorized' },
              403: { $ref: '#/components/responses/Forbidden' },
              404: { $ref: '#/components/responses/NotFound' },
              500: { $ref: '#/components/responses/InternalServerError' }
            }
          },
          put: {
            summary: 'Update user settings',
            description: 'Update user authentication and access settings. Only specified fields will be updated. Requires admin authentication.',
            tags: ['Users'],
            security: [{ bearerAuth: [] }],
            parameters: [{ $ref: '#/components/parameters/IdParam' }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
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
                  }
                }
              }
            },
            responses: {
              200: {
                description: 'User updated successfully',
                content: {
                  'application/json': {
                    schema: {
                      allOf: [
                        { $ref: '#/components/schemas/ApiResponse' },
                        {
                          type: 'object',
                          properties: {
                            data: { $ref: '#/components/schemas/User' }
                          }
                        }
                      ]
                    }
                  }
                }
              },
              400: { $ref: '#/components/responses/BadRequest' },
              401: { $ref: '#/components/responses/Unauthorized' },
              403: { $ref: '#/components/responses/Forbidden' },
              404: { $ref: '#/components/responses/NotFound' },
              500: { $ref: '#/components/responses/InternalServerError' }
            }
          },
          delete: {
            summary: 'Delete user',
            description: 'Permanently delete a user account. This will cascade delete all associated file sharing links and audit logs. Requires admin authentication.',
            tags: ['Users'],
            security: [{ bearerAuth: [] }],
            parameters: [{ $ref: '#/components/parameters/IdParam' }],
            responses: {
              200: {
                description: 'User deleted successfully',
                content: {
                  'application/json': {
                    schema: {
                      allOf: [
                        { $ref: '#/components/schemas/ApiResponse' },
                        {
                          type: 'object',
                          properties: {
                            data: {
                              type: 'object',
                              properties: {
                                message: {
                                  type: 'string',
                                  example: 'User deleted successfully'
                                }
                              }
                            }
                          }
                        }
                      ]
                    }
                  }
                }
              },
              401: { $ref: '#/components/responses/Unauthorized' },
              403: { $ref: '#/components/responses/Forbidden' },
              404: { $ref: '#/components/responses/NotFound' },
              500: { $ref: '#/components/responses/InternalServerError' }
            }
          }
        },
        '/api/files': {
          get: {
            summary: 'Get all file sharing links with pagination',
            description: 'Retrieve a paginated list of file sharing links. Can be filtered by owner. Public endpoint (no authentication required).',
            tags: ['Files'],
            parameters: [
              { $ref: '#/components/parameters/PageParam' },
              { $ref: '#/components/parameters/LimitParam' },
              {
                name: 'ownerId',
                in: 'query',
                description: 'Filter files by owner ID',
                required: false,
                schema: {
                  type: 'string',
                  format: 'uuid'
                },
                example: '550e8400-e29b-41d4-a716-446655440000'
              }
            ],
            responses: {
              200: {
                description: 'Successfully retrieved file sharing links',
                content: {
                  'application/json': {
                    schema: {
                      allOf: [
                        { $ref: '#/components/schemas/ApiResponse' },
                        {
                          type: 'object',
                          properties: {
                            data: {
                              allOf: [
                                { $ref: '#/components/schemas/PaginatedResponse' },
                                {
                                  type: 'object',
                                  properties: {
                                    data: {
                                      type: 'array',
                                      items: { $ref: '#/components/schemas/FileSharingLink' }
                                    }
                                  }
                                }
                              ]
                            }
                          }
                        }
                      ]
                    }
                  }
                }
              },
              500: { $ref: '#/components/responses/InternalServerError' }
            }
          },
          post: {
            summary: 'Create a new file sharing link',
            description: 'Create a new file sharing link for simulated file sharing. Requires admin authentication.',
            tags: ['Files'],
            security: [{ bearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
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
                      fileType: { $ref: '#/components/schemas/FileType' },
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
                  }
                }
              }
            },
            responses: {
              201: {
                description: 'File sharing link created successfully',
                content: {
                  'application/json': {
                    schema: {
                      allOf: [
                        { $ref: '#/components/schemas/ApiResponse' },
                        {
                          type: 'object',
                          properties: {
                            data: { $ref: '#/components/schemas/FileSharingLink' }
                          }
                        }
                      ]
                    }
                  }
                }
              },
              400: { $ref: '#/components/responses/BadRequest' },
              401: { $ref: '#/components/responses/Unauthorized' },
              403: { $ref: '#/components/responses/Forbidden' },
              500: { $ref: '#/components/responses/InternalServerError' }
            }
          }
        },
        '/api/files/{id}': {
          get: {
            summary: 'Get file sharing link by ID',
            description: 'Retrieve detailed information about a specific file sharing link by its ID. Includes owner information. Public endpoint (no authentication required).',
            tags: ['Files'],
            parameters: [{ $ref: '#/components/parameters/IdParam' }],
            responses: {
              200: {
                description: 'Successfully retrieved file sharing link details',
                content: {
                  'application/json': {
                    schema: {
                      allOf: [
                        { $ref: '#/components/schemas/ApiResponse' },
                        {
                          type: 'object',
                          properties: {
                            data: { $ref: '#/components/schemas/FileSharingLink' }
                          }
                        }
                      ]
                    }
                  }
                }
              },
              404: { $ref: '#/components/responses/NotFound' },
              500: { $ref: '#/components/responses/InternalServerError' }
            }
          }
        },
        '/api/audit-logs': {
          get: {
            summary: 'Get audit logs with filtering',
            description: 'Retrieve a paginated and filterable list of audit log entries. Includes related user and file information. Requires admin authentication.',
            tags: ['Audit'],
            security: [{ bearerAuth: [] }],
            parameters: [
              { $ref: '#/components/parameters/PageParam' },
              { $ref: '#/components/parameters/LimitParam' },
              {
                name: 'eventType',
                in: 'query',
                description: 'Filter by event type',
                required: false,
                schema: { $ref: '#/components/schemas/EventType' },
                example: 'login'
              },
              {
                name: 'userId',
                in: 'query',
                description: 'Filter by user ID',
                required: false,
                schema: {
                  type: 'string',
                  format: 'uuid'
                },
                example: '550e8400-e29b-41d4-a716-446655440000'
              },
              {
                name: 'fileId',
                in: 'query',
                description: 'Filter by file ID',
                required: false,
                schema: {
                  type: 'string',
                  format: 'uuid'
                },
                example: '550e8400-e29b-41d4-a716-446655440001'
              },
              {
                name: 'startDate',
                in: 'query',
                description: 'Filter events after this date',
                required: false,
                schema: {
                  type: 'string',
                  format: 'date-time'
                },
                example: '2024-01-01T00:00:00.000Z'
              },
              {
                name: 'endDate',
                in: 'query',
                description: 'Filter events before this date',
                required: false,
                schema: {
                  type: 'string',
                  format: 'date-time'
                },
                example: '2024-01-31T23:59:59.999Z'
              }
            ],
            responses: {
              200: {
                description: 'Successfully retrieved audit logs',
                content: {
                  'application/json': {
                    schema: {
                      allOf: [
                        { $ref: '#/components/schemas/ApiResponse' },
                        {
                          type: 'object',
                          properties: {
                            data: {
                              allOf: [
                                { $ref: '#/components/schemas/PaginatedResponse' },
                                {
                                  type: 'object',
                                  properties: {
                                    data: {
                                      type: 'array',
                                      items: { $ref: '#/components/schemas/AuditLog' }
                                    }
                                  }
                                }
                              ]
                            }
                          }
                        }
                      ]
                    }
                  }
                }
              },
              401: { $ref: '#/components/responses/Unauthorized' },
              403: { $ref: '#/components/responses/Forbidden' },
              500: { $ref: '#/components/responses/InternalServerError' }
            }
          }
        },
        '/api/audit-logs/inject-attack': {
          post: {
            summary: 'Inject simulated attack events',
            description: 'Simulates a coordinated attack by generating multiple download events from a single IP address over 50 seconds to demonstrate attack pattern detection. This is for security testing purposes. Requires admin authentication.',
            tags: ['Audit'],
            security: [{ bearerAuth: [] }],
            responses: {
              200: {
                description: 'Attack simulation initiated successfully',
                content: {
                  'application/json': {
                    schema: {
                      allOf: [
                        { $ref: '#/components/schemas/ApiResponse' },
                        {
                          type: 'object',
                          properties: {
                            data: {
                              type: 'object',
                              properties: {
                                message: {
                                  type: 'string',
                                  example: 'Attack simulation started'
                                }
                              }
                            }
                          }
                        }
                      ]
                    }
                  }
                }
              },
              401: { $ref: '#/components/responses/Unauthorized' },
              403: { $ref: '#/components/responses/Forbidden' },
              500: { $ref: '#/components/responses/InternalServerError' }
            }
          }
        },
        '/api/settings': {
          get: {
            summary: 'Get global application settings',
            description: 'Retrieve the current global settings for the application. Creates default settings if none exist. Public endpoint (no authentication required).',
            tags: ['Settings'],
            responses: {
              200: {
                description: 'Successfully retrieved global settings',
                content: {
                  'application/json': {
                    schema: {
                      allOf: [
                        { $ref: '#/components/schemas/ApiResponse' },
                        {
                          type: 'object',
                          properties: {
                            data: { $ref: '#/components/schemas/GlobalSettings' }
                          }
                        }
                      ]
                    }
                  }
                }
              },
              500: { $ref: '#/components/responses/InternalServerError' }
            }
          },
          put: {
            summary: 'Update global application settings',
            description: 'Update global settings for IP restrictions, IdP enforcement, and file sharing policies. Only specified fields will be updated. Requires admin authentication.',
            tags: ['Settings'],
            security: [{ bearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      allowedIpRanges: {
                        type: 'array',
                        items: {
                          type: 'string'
                        },
                        description: 'List of allowed IP ranges in CIDR notation'
                      },
                      forceIdpLogin: {
                        type: 'boolean',
                        description: 'Whether to force identity provider login'
                      },
                      sharingLevel: { $ref: '#/components/schemas/SharingLevel' }
                    }
                  }
                }
              }
            },
            responses: {
              200: {
                description: 'Settings updated successfully',
                content: {
                  'application/json': {
                    schema: {
                      allOf: [
                        { $ref: '#/components/schemas/ApiResponse' },
                        {
                          type: 'object',
                          properties: {
                            data: { $ref: '#/components/schemas/GlobalSettings' }
                          }
                        }
                      ]
                    }
                  }
                }
              },
              400: { $ref: '#/components/responses/BadRequest' },
              401: { $ref: '#/components/responses/Unauthorized' },
              403: { $ref: '#/components/responses/Forbidden' },
              500: { $ref: '#/components/responses/InternalServerError' }
            }
          }
        },
        '/health': {
          get: {
            summary: 'Health check endpoint',
            description: 'Check if the API server is running and responsive. Returns current timestamp.',
            tags: ['System'],
            responses: {
              200: {
                description: 'Server is healthy',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: {
                          type: 'string',
                          example: 'OK'
                        },
                        timestamp: {
                          type: 'string',
                          format: 'date-time',
                          example: '2024-01-15T10:30:00.000Z'
                        }
                      }
                    }
                  }
                }
              }
            }
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
        },
        {
          name: 'System',
          description: 'System health and monitoring endpoints'
        }
      ]
    }
    
    return c.json(spec)
  })

  // Serve Swagger UI
  app.get('/api-docs', swaggerUI({ url: '/api-docs.json' }))
}