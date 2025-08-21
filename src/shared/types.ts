export type UserRole = 'admin' | 'superadmin' | 'user' | 'guest'

export type FileType = 'pdf' | 'xlsx' | 'docx' | 'pptx' | 'txt' | 'csv' | 'zip' | 'jpg' | 'png' | 'mp4'

export type EventType = 'login' | 'download' | 'failedLogin' | 'failedDownload'

export type SharingLevel = 'doNotAllowPasswords' | 'allowPasswords' | 'forcePasswords'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  mfaEnabled: boolean
  allowLocalLogin: boolean
  allowIdpLogin: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface FileSharingLink {
  id: string
  ownerId: string
  fileName: string
  fileType: FileType
  hasPassword: boolean
  expiryDate: string | null
  active: boolean
  createdAt: string
  updatedAt: string
  owner?: User
}

export interface AuditLog {
  id: string
  timestamp: string
  eventType: EventType
  userId: string | null
  fileId: string | null
  ipAddress: string
  userAgent: string
  details: string | null
  user?: User
  file?: FileSharingLink
}

export interface GlobalSettings {
  id: number
  allowedIpRanges: string[]
  forceIdpLogin: boolean
  sharingLevel: SharingLevel
  createdAt: string
  updatedAt: string
}

export interface AuthToken {
  token: string
  user: User
}

export interface LoginRequest {
  username: string
  password: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}