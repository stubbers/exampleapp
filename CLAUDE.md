# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **simulated file sharing application** designed as a honeypot/testing target for security tools analyzing SaaS environments. It does NOT implement actual file storage - it only simulates file sharing functionality with synthetic data.

## Architecture

- **Frontend**: React + React Router + TailwindCSS
- **Backend**: Node.js + Express (REST APIs)
- **Database**: Prisma ORM with SQLite (default) or Postgres
- **Deployment**: Docker container with multi-stage build

## Core Data Models

### Users
- UUID-based with firstName/lastName generating `firstname.lastname@exampleapp.com` emails
- Roles: `admin`, `superadmin`, `user`, `guest`
- Attributes for MFA, local/IdP login, and active status

### File Sharing Links
- UUID-based with GUID fileName and predefined fileTypes (`pdf`, `xlsx`, etc.)
- Links to Users via ownerId, includes password protection and expiry

### Audit Logs
- Synthetic events: `login`, `download`, `failedLogin`, `failedDownload`
- Australian IP ranges only, Chrome/Safari user agents only
- Background simulator generates events at configurable rates with attack spikes

### Global Settings
- Singleton configuration for IP ranges, IdP enforcement, password policies

## Development Commands

- `npm run dev` - Start both frontend and backend development servers
- `npm run dev:server` - Start backend server only (port 3001)
- `npm run dev:client` - Start frontend dev server only (port 3000)
- `npm run build` - Build entire application for production
- `npm run build:server` - Build backend only
- `npm run build:client` - Build frontend only
- `npm start` - Start production server
- `npm run lint` - Run ESLint (mandatory for CI)
- `npm run type-check` - Run TypeScript checking (mandatory for CI)
- `npx prisma validate` - Validate Prisma schema (mandatory for CI)
- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes to database
- `npm run prisma:seed` - Seed database with synthetic data
- `docker-compose up` - Run entire stack with Docker

## Environment Configuration

Key environment variables:
- `SEED=true|false` - Whether to reset and reseed database
- `SEED_USERS=n` - Number of users to generate
- `SEED_FILES=n` - Number of file links to generate
- `LOG_EVENTS_PER_SECOND` - Rate of synthetic audit log generation
- `LOG_RETENTION_DAYS` - How long to keep audit logs
- Fixed admin credentials in `.env`

## API Endpoints (Read-Only)

- `GET /api/users` - List all users with full attributes
- `GET /api/files` - List file links (paginated)
- `GET /api/audit-logs` - List audit logs (paginated + filterable)
- `GET /api/settings` - Global settings
- Swagger/OpenAPI 3.0 spec available

## UI Features

Admin-only interface with:
- User management (CRUD + toggle permissions)
- File sharing links management
- Audit log viewer with search/filtering
- Global settings editor

## Quality Requirements

- TypeScript type checking is mandatory
- ESLint + Prettier linting is mandatory
- Prisma schema validation is mandatory
- GitHub Actions CI pipeline checks all of the above
- Focus on functionality over UI polish

## Deployment

- Multi-stage Dockerfile for build + runtime
- Docker Compose setup with optional Postgres
- Portable SQLite for local development