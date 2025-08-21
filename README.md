# ExampleApp - Simulated File Sharing Application

A simulated file sharing application designed to mimic the functionality of a SaaS-style file collaboration platform for security testing and analysis.

## Features

- **React Frontend**: Modern UI with TailwindCSS
- **Express Backend**: REST APIs with OpenAPI/Swagger documentation
- **Database**: Prisma ORM with SQLite (default) or PostgreSQL support
- **Authentication**: Admin-only access with JWT tokens
- **Synthetic Data**: Generates realistic users, files, and audit logs
- **Real-time Simulation**: Background audit log generation with attack spikes
- **Security Testing**: Designed as a honeypot/testing target

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Development Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env if needed (defaults work for development)
   ```

3. **Initialize database:**
   ```bash
   npx prisma db push
   npm run prisma:seed
   ```

4. **Start development servers:**
   ```bash
   npm run dev
   ```

   This starts both the frontend (http://localhost:3000) and backend (http://localhost:3001)

5. **Access the application:**
   - Frontend: http://localhost:3000
   - API Documentation: http://localhost:3001/api-docs
   - Default login: `admin` / `admin123`

### Production Deployment

#### Using Docker

```bash
# Build and run with Docker Compose
docker-compose up

# Or build manually
docker build -t exampleapp .
docker run -p 3001:3001 exampleapp
```

#### Manual Build

```bash
npm run build
npm start
```

## Development Commands

- `npm run dev` - Start development servers (frontend + backend)
- `npm run build` - Build for production
- `npm run type-check` - Run TypeScript checking
- `npm run lint` - Run ESLint
- `npx prisma validate` - Validate Prisma schema
- `npm run prisma:seed` - Seed database with synthetic data

## Configuration

Key environment variables:

- `DATABASE_URL` - Database connection (SQLite by default)
- `JWT_SECRET` - Secret for JWT token signing
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` - Admin credentials
- `SEED_USERS` / `SEED_FILES` - Number of entities to generate
- `LOG_EVENTS_PER_SECOND` - Rate of audit log generation
- `LOG_RETENTION_DAYS` - How long to keep audit logs

## API Endpoints

- `GET /api/users` - List users (with pagination)
- `GET /api/files` - List file sharing links
- `GET /api/audit-logs` - List audit events (with filtering)
- `GET /api/settings` - Get global settings
- `POST /api/auth/login` - Admin authentication

Full API documentation available at `/api-docs` when running.

## Data Models

### Users
- UUID-based with generated emails
- Roles: admin, superadmin, user, guest
- MFA, local/IdP login, and active status flags

### File Sharing Links
- Simulated file sharing with various file types
- Password protection and expiry date support
- Linked to user owners

### Audit Logs
- Real-time event generation (login, download, failures)
- Australian IP ranges and realistic user agents
- Background simulator with attack spikes

### Global Settings
- IP range restrictions (CIDR notation)
- IdP login enforcement
- File sharing password policies

## Architecture

- **Frontend**: React 18 + React Router + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: Prisma ORM (SQLite/PostgreSQL)
- **Authentication**: JWT tokens
- **Documentation**: Swagger/OpenAPI 3.0
- **CI/CD**: GitHub Actions
- **Deployment**: Docker + Docker Compose

## Security Note

This application is designed for **testing and simulation purposes only**. It intentionally generates synthetic data and should not be used with real sensitive information.

## License

MIT