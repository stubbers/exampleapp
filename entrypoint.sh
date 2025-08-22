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

# Rename server files to avoid ES module conflicts and fix imports
find dist/server -name "*.js" -exec sh -c '
  # Fix relative imports in the file before renaming
  sed -i "s|require(\"\./|require(\"\./|g; s|require(\"\./\([^\"]*\)\")|require(\"\./\1.cjs\")|g" "$1"
  # Rename the file
  mv "$1" "${1%.js}.cjs"
' _ {} \;

# Start the application
echo "Starting server..."
exec node dist/server/index.cjs