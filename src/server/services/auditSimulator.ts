import { PrismaClient } from '@prisma/client'
import {
  getRandomElement,
  generateRandomIP,
  EVENT_TYPES,
  USER_AGENTS
} from '../utils/generators.js'

const prisma = new PrismaClient()

class AuditSimulator {
  private intervalId: NodeJS.Timeout | null = null
  private spikeTimeoutId: NodeJS.Timeout | null = null
  private isSpike = false

  async start() {
    const eventsPerSecond = parseFloat(process.env.LOG_EVENTS_PER_SECOND || '2')
    const intervalMs = 1000 / eventsPerSecond

    console.log(`Starting audit simulator: ${eventsPerSecond} events/second`)

    this.intervalId = setInterval(() => {
      this.generateEvent()
    }, intervalMs)

    this.scheduleNextSpike()
    this.startCleanupTask()
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    if (this.spikeTimeoutId) {
      clearTimeout(this.spikeTimeoutId)
      this.spikeTimeoutId = null
    }
  }

  private async generateEvent() {
    try {
      const users = await this.getRandomUsers()
      const files = await this.getRandomFiles()

      let eventType = getRandomElement(EVENT_TYPES)
      let userId: string | null = null
      let fileId: string | null = null
      let details: string | null = null

      if (this.isSpike) {
        eventType = Math.random() < 0.7 ? 'failedLogin' : 'failedDownload'
      } else {
        // Make downloads more common and failures less frequent
        const rand = Math.random()
        if (rand < 0.5) {
          eventType = 'download'
        } else if (rand < 0.8) {
          eventType = 'login'
        } else if (rand < 0.9) {
          eventType = 'failedDownload'
        } else {
          eventType = 'failedLogin'
        }
      }

      if (eventType === 'login' || eventType === 'failedLogin') {
        // Login and failed login events must always be associated with a user
        if (users.length > 0) {
          userId = getRandomElement(users).id
        } else {
          // If no users available, skip this event
          return
        }
        details = eventType === 'failedLogin' ? 'Invalid password attempt' : 'Successful login'
      } else if (eventType === 'download' || eventType === 'failedDownload') {
        if (files.length > 0) {
          const file = getRandomElement(files)
          fileId = file.id
          // Downloads can be anonymous, so only sometimes associate with owner
          if (Math.random() < 0.3) {
            userId = file.ownerId
          }
        }
        details = eventType === 'failedDownload' ? 'Access denied - expired link' : 'File downloaded successfully'
      }

      await prisma.auditLog.create({
        data: {
          eventType,
          userId,
          fileId,
          ipAddress: generateRandomIP(),
          userAgent: getRandomElement(USER_AGENTS),
          details
        }
      })
    } catch (error) {
      console.error('Error generating audit event:', error)
    }
  }

  private async getRandomUsers() {
    return await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    })
  }

  private async getRandomFiles() {
    return await prisma.fileSharingLink.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    })
  }

  private scheduleNextSpike() {
    const nextSpikeIn = Math.random() * 300000 + 60000 // 1-5 minutes
    
    this.spikeTimeoutId = setTimeout(() => {
      this.startSpike()
    }, nextSpikeIn)
  }

  private startSpike() {
    console.log('Starting audit log spike (5x normal rate)')
    this.isSpike = true

    const spikeDuration = Math.random() * 30000 + 15000 // 15-45 seconds

    setTimeout(() => {
      this.isSpike = false
      console.log('Spike ended, returning to normal rate')
      this.scheduleNextSpike()
    }, spikeDuration)
  }

  private startCleanupTask() {
    const cleanupInterval = 60 * 60 * 1000 // 1 hour
    
    setInterval(async () => {
      await this.cleanupOldLogs()
    }, cleanupInterval)

    setTimeout(() => {
      this.cleanupOldLogs()
    }, 10000)
  }

  private async cleanupOldLogs() {
    try {
      const retentionDays = parseInt(process.env.LOG_RETENTION_DAYS || '30')
      const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000))

      const deletedCount = await prisma.auditLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      })

      if (deletedCount.count > 0) {
        console.log(`Cleaned up ${deletedCount.count} old audit logs (older than ${retentionDays} days)`)
      }
    } catch (error) {
      console.error('Error cleaning up old logs:', error)
    }
  }

  async injectAttack() {
    try {
      console.log('Starting attack injection - downloading all files from single IP over 50 seconds')
      
      const files = await prisma.fileSharingLink.findMany()
      const attackIP = generateRandomIP()
      const userAgent = getRandomElement(USER_AGENTS)
      const intervalMs = 50000 / files.length // Spread over 50 seconds
      
      files.forEach((file, index) => {
        setTimeout(async () => {
          await prisma.auditLog.create({
            data: {
              eventType: 'download',
              userId: null, // Anonymous download for attack
              fileId: file.id,
              ipAddress: attackIP,
              userAgent,
              details: 'File downloaded successfully - ATTACK SIMULATION'
            }
          })
          
          if (index === files.length - 1) {
            console.log(`Attack injection completed - ${files.length} downloads from ${attackIP}`)
          }
        }, index * intervalMs)
      })
      
      return { 
        success: true, 
        message: `Attack injection started - ${files.length} downloads from ${attackIP} over 50 seconds` 
      }
    } catch (error) {
      console.error('Error injecting attack:', error)
      return { success: false, message: 'Failed to inject attack' }
    }
  }
}

const simulator = new AuditSimulator()

export function startAuditSimulator() {
  simulator.start()
}

export function stopAuditSimulator() {
  simulator.stop()
}

export function injectAttack() {
  return simulator.injectAttack()
}

process.on('SIGINT', () => {
  simulator.stop()
})

process.on('SIGTERM', () => {
  simulator.stop()
})