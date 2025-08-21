import { v4 as uuidv4 } from 'uuid'
import type { UserRole, FileType, EventType } from '@/shared/types'

export const FIRST_NAMES = [
  'Liam', 'Emma', 'Noah', 'Olivia', 'William', 'Ava', 'James', 'Isabella', 'Oliver', 'Sophia',
  'Benjamin', 'Charlotte', 'Elijah', 'Mia', 'Lucas', 'Amelia', 'Mason', 'Harper', 'Logan', 'Evelyn',
  'Alexander', 'Abigail', 'Ethan', 'Emily', 'Jacob', 'Elizabeth', 'Michael', 'Mila', 'Daniel', 'Ella',
  'Henry', 'Avery', 'Jackson', 'Sofia', 'Sebastian', 'Camila', 'Aiden', 'Aria', 'Matthew', 'Scarlett',
  'Samuel', 'Victoria', 'David', 'Madison', 'Joseph', 'Luna', 'Carter', 'Grace', 'Owen', 'Chloe',
  'Wyatt', 'Penelope', 'John', 'Layla', 'Jack', 'Riley', 'Luke', 'Zoey', 'Jayden', 'Nora',
  'Dylan', 'Lily', 'Grayson', 'Eleanor', 'Levi', 'Hannah', 'Isaac', 'Lillian', 'Gabriel', 'Addison',
  'Julian', 'Aubrey', 'Mateo', 'Ellie', 'Anthony', 'Stella', 'Jaxon', 'Natalie', 'Lincoln', 'Zoe',
  'Joshua', 'Leah', 'Christopher', 'Hazel', 'Andrew', 'Violet', 'Theodore', 'Aurora', 'Caleb', 'Savannah',
  'Ryan', 'Audrey', 'Asher', 'Brooklyn', 'Felix', 'Bella', 'Thomas', 'Claire', 'Leo', 'Skylar',
  'Isaiah', 'Lucy', 'Charles', 'Paisley', 'Josiah', 'Everly', 'Hudson', 'Anna', 'Sebastian', 'Caroline',
  'Jameson', 'Nova', 'Axel', 'Genesis', 'Nathan', 'Emilia', 'Eli', 'Kennedy', 'Max', 'Samantha',
  'Connor', 'Maya', 'Cameron', 'Willow', 'Santiago', 'Kinsley', 'Ezra', 'Naomi', 'Colton', 'Aaliyah',
  'Mason', 'Elena', 'Nolan', 'Sarah', 'Jonathan', 'Ariana', 'Robert', 'Allison', 'Jeremiah', 'Gabriella',
  'Easton', 'Alice', 'Miles', 'Madelyn', 'Adrian', 'Cora', 'Kai', 'Ruby', 'Parker', 'Eva',
  'Hunter', 'Serenity', 'Brayden', 'Autumn', 'Adam', 'Adeline', 'Jace', 'Hailey', 'Ian', 'Gianna',
  'Cooper', 'Valentina', 'Dominic', 'Isla', 'Juan', 'Eliana', 'Ayden', 'Quinn', 'Blake', 'Nevaeh',
  'Jason', 'Ivy', 'Carson', 'Sadie', 'Jaxson', 'Piper', 'Maverick', 'Lydia', 'Gavin', 'Alexa',
  'Bentley', 'Josephine', 'Calvin', 'Emery', 'Collin', 'Julia', 'Kaiden', 'Delilah', 'Nicholas', 'Arianna',
  'Brody', 'Vivian', 'Aaron', 'Kaylee', 'Ryder', 'Sophie', 'Abel', 'Brielle', 'Timothy', 'Madeline'
]

export const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez',
  'Powell', 'Jenkins', 'Perry', 'Russell', 'Sullivan', 'Bell', 'Coleman', 'Butler', 'Henderson', 'Barnes',
  'Gonzales', 'Fisher', 'Vasquez', 'Simmons', 'Romero', 'Jordan', 'Patterson', 'Alexander', 'Hamilton', 'Graham',
  'Reynolds', 'Griffin', 'Wallace', 'Moreno', 'West', 'Cole', 'Hayes', 'Bryant', 'Herrera', 'Gibson',
  'Ellis', 'Tran', 'Medina', 'Aguilar', 'Stevens', 'Murray', 'Ford', 'Castro', 'Marshall', 'Owens',
  'Harrison', 'Fernandez', 'Mcdonald', 'Woods', 'Washington', 'Kennedy', 'Wells', 'Vargas', 'Henry', 'Freeman',
  'Webb', 'Tucker', 'Guzman', 'Burns', 'Crawford', 'Olson', 'Simpson', 'Porter', 'Hunter', 'Gordon',
  'Mendez', 'Silva', 'Shaw', 'Snyder', 'Mason', 'Dixon', 'Munoz', 'Hunt', 'Hicks', 'Holmes',
  'Palmer', 'Wagner', 'Black', 'Robertson', 'Boyd', 'Rose', 'Stone', 'Salazar', 'Fox', 'Warren',
  'Mills', 'Meyer', 'Rice', 'Robertson', 'Knight', 'Lane', 'Fernandez', 'Berry', 'Mason', 'Day',
  'Schmidt', 'Owens', 'Burke', 'Wheeler', 'Garrett', 'Gardner', 'Lane', 'Lawrence', 'Chapman', 'Ray'
]

export const FILE_TYPES: FileType[] = ['pdf', 'xlsx', 'docx', 'pptx', 'txt', 'csv', 'zip', 'jpg', 'png', 'mp4']

export const USER_ROLES: UserRole[] = ['user', 'guest', 'admin', 'superadmin']

export const EVENT_TYPES: EventType[] = ['login', 'download', 'failedLogin', 'failedDownload']

export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
]

export const AUSTRALIAN_IP_RANGES = [
  '1.128.0.0/11',
  '14.0.0.0/8',
  '27.0.0.0/8',
  '58.6.0.0/15',
  '101.160.0.0/11',
  '103.1.8.0/22',
  '110.4.0.0/14',
  '115.64.0.0/10',
  '124.148.0.0/14',
  '139.130.0.0/16',
  '150.101.0.0/16',
  '163.47.0.0/16',
  '175.45.0.0/16',
  '180.150.0.0/15',
  '202.0.0.0/11'
]

export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

export function generateRandomName(): { firstName: string; lastName: string } {
  return {
    firstName: getRandomElement(FIRST_NAMES),
    lastName: getRandomElement(LAST_NAMES)
  }
}

export function generateGuidFileName(): string {
  return uuidv4().replace(/-/g, '').substring(0, 16)
}

export function generateRandomIP(): string {
  const range = getRandomElement(AUSTRALIAN_IP_RANGES)
  const [network, prefixStr] = range.split('/')
  const prefix = parseInt(prefixStr)
  
  const networkParts = network.split('.').map(Number)
  const hostBits = 32 - prefix
  const maxHosts = Math.pow(2, hostBits) - 2
  const randomHost = Math.floor(Math.random() * maxHosts) + 1
  
  let ip = 0
  for (let i = 0; i < 4; i++) {
    ip = (ip << 8) | networkParts[i]
  }
  
  const hostMask = (1 << hostBits) - 1
  const networkMask = ~hostMask
  const finalIP = (ip & networkMask) | randomHost
  
  return [
    (finalIP >>> 24) & 255,
    (finalIP >>> 16) & 255,
    (finalIP >>> 8) & 255,
    finalIP & 255
  ].join('.')
}

export function generateRandomDate(daysFromNow: number = 30): Date {
  const now = new Date()
  const future = new Date(now.getTime() + (daysFromNow * 24 * 60 * 60 * 1000))
  const random = new Date(now.getTime() + Math.random() * (future.getTime() - now.getTime()))
  return random
}

export function generateExpiryDate(): Date | null {
  if (Math.random() < 0.3) return null
  return generateRandomDate(Math.floor(Math.random() * 90) + 1)
}

export function generateSharingLevel() {
  const levels = ['doNotAllowPasswords', 'allowPasswords', 'forcePasswords']
  return getRandomElement(levels)
}

export function generateIPRanges(): string[] {
  const count = Math.floor(Math.random() * 5) + 1
  const ranges = []
  
  for (let i = 0; i < count; i++) {
    const baseIP = generateRandomIP()
    const prefix = Math.floor(Math.random() * 8) + 16
    ranges.push(`${baseIP}/${prefix}`)
  }
  
  return ranges
}