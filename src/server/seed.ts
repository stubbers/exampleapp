import { PrismaClient } from '@prisma/client'
import {
  generateRandomName,
  generateGuidFileName,
  generateExpiryDate,
  generateSharingLevel,
  generateIPRanges,
  getRandomElement,
  FILE_TYPES,
  USER_ROLES
} from './utils/generators'

const prisma = new PrismaClient()

export async function seedDatabase() {
  try {
    console.log('Starting database seeding...')

    await prisma.auditLog.deleteMany()
    await prisma.fileSharingLink.deleteMany()
    // Don't delete admin users to preserve authentication
    await prisma.user.deleteMany({
      where: {
        NOT: {
          email: 'admin@exampleapp.com'
        }
      }
    })
    await prisma.globalSettings.deleteMany()

    const seedUsers = parseInt(process.env.SEED_USERS || '50')
    const seedFiles = parseInt(process.env.SEED_FILES || '200')

    console.log(`Creating ${seedUsers} users...`)
    const users = []
    
    for (let i = 0; i < seedUsers; i++) {
      const { firstName, lastName } = generateRandomName()
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@exampleapp.com`
      
      try {
        const user = await prisma.user.create({
          data: {
            firstName,
            lastName,
            email,
            role: getRandomElement(USER_ROLES),
            mfaEnabled: Math.random() < 0.3,
            allowLocalLogin: Math.random() < 0.8,
            allowIdpLogin: Math.random() < 0.4,
            active: Math.random() < 0.9
          }
        })
        users.push(user)
      } catch {
        console.warn(`Skipping duplicate user: ${email}`)
      }
    }

    console.log(`Created ${users.length} users`)
    console.log(`Creating ${seedFiles} file sharing links...`)

    for (let i = 0; i < seedFiles; i++) {
      const owner = getRandomElement(users)
      
      await prisma.fileSharingLink.create({
        data: {
          ownerId: owner.id,
          fileName: generateGuidFileName(),
          fileType: getRandomElement(FILE_TYPES),
          hasPassword: Math.random() < 0.4,
          expiryDate: generateExpiryDate(),
          active: Math.random() < 0.85
        }
      })
    }

    console.log('Creating global settings...')
    await prisma.globalSettings.create({
      data: {
        allowedIpRanges: JSON.stringify(generateIPRanges()),
        forceIdpLogin: Math.random() < 0.3,
        sharingLevel: generateSharingLevel()
      }
    })

    console.log('Database seeded successfully!')
  } catch (error) {
    console.error('Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  seedDatabase()
    .catch((error) => {
      console.error('Seeding failed:', error)
      process.exit(1)
    })
}