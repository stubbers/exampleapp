#!/bin/bash
set -e

echo "Starting ExampleApp..."

# Set default environment variables if not provided
export DATABASE_URL=${DATABASE_URL:-"file:./data/app.db"}
export JWT_SECRET=${JWT_SECRET:-"your-super-secret-jwt-key"}
export ADMIN_USERNAME=${ADMIN_USERNAME:-"admin"}
export ADMIN_PASSWORD=${ADMIN_PASSWORD:-"admin123"}
export NODE_ENV=${NODE_ENV:-"production"}
export SEED=${SEED:-"true"}
export SEED_USERS=${SEED_USERS:-"100"}
export SEED_FILES=${SEED_FILES:-"500"}
export LOG_EVENTS_PER_SECOND=${LOG_EVENTS_PER_SECOND:-"5"}
export LOG_RETENTION_DAYS=${LOG_RETENTION_DAYS:-"30"}

echo "Database URL: $DATABASE_URL"
echo "Environment: $NODE_ENV"

# Initialize database
echo "Initializing database..."
npx prisma db push --force-reset

# Start the application
echo "Starting server..."
exec node dist/server/index.js