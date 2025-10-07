#!/bin/bash
# Apply Database Migration using Docker
# This script uses Docker to run PostgreSQL client and apply the migration

set -e

echo "🔧 Applying Database Migration via Docker..."
echo ""

# Database connection details
DB_HOST="aws-0-ap-southeast-2.pooler.supabase.com"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres.qohyutlxwekppkrdlamp"
DB_PASSWORD="Lust&Lace123!"

# Try alternative hosts
HOSTS=(
    "aws-0-ap-southeast-2.pooler.supabase.com"
    "db.qohyutlxwekppkrdlamp.supabase.co"
)

PORTS=(
    "6543"
    "5432"
)

MIGRATION_FILE="supabase/migrations/20251007191944_complete-backend-schema.sql"

echo "📁 Migration file: $MIGRATION_FILE"
echo ""

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "🔍 Trying different connection methods..."
echo ""

SUCCESS=0

for HOST in "${HOSTS[@]}"; do
    for PORT in "${PORTS[@]}"; do
        echo "Trying: $HOST:$PORT..."

        CONNECTION_STRING="postgresql://$DB_USER:$DB_PASSWORD@$HOST:$PORT/$DB_NAME"

        if docker run --rm -i postgres:15 psql "$CONNECTION_STRING" -c "SELECT 1;" > /dev/null 2>&1; then
            echo "✅ Connection successful!"
            echo ""
            echo "📤 Applying migration..."

            docker run --rm -i postgres:15 psql "$CONNECTION_STRING" < "$MIGRATION_FILE"

            if [ $? -eq 0 ]; then
                echo ""
                echo "✅ Migration applied successfully!"
                SUCCESS=1
                break 2
            else
                echo "❌ Migration failed"
            fi
        else
            echo "❌ Connection failed"
        fi
        echo ""
    done
done

if [ $SUCCESS -eq 0 ]; then
    echo ""
    echo "❌ Could not connect to database with any method"
    echo ""
    echo "📋 Manual Steps:"
    echo "1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/qohyutlxwekppkrdlamp"
    echo "2. Check if project is paused - unpause if needed"
    echo "3. Go to Settings → Database"
    echo "4. Copy the Connection String"
    echo "5. Use Supabase SQL Editor instead:"
    echo "   https://supabase.com/dashboard/project/qohyutlxwekppkrdlamp/sql"
    echo ""
    echo "6. Copy contents of: $MIGRATION_FILE"
    echo "7. Paste and Run in SQL Editor"
    exit 1
fi

echo ""
echo "🎉 Done! Database schema applied."
echo ""
echo "Next step: Run seed script"
echo "  npm run db:seed"
