@echo off
REM Apply Database Migration using Docker
REM This script uses Docker to run PostgreSQL client and apply the migration

echo 🔧 Applying Database Migration via Docker...
echo.

set DB_USER=postgres.qohyutlxwekppkrdlamp
set DB_PASSWORD=Lust^&Lace123!
set DB_NAME=postgres
set MIGRATION_FILE=supabase\migrations\20251007191944_complete-backend-schema.sql

echo 📁 Migration file: %MIGRATION_FILE%
echo.

if not exist "%MIGRATION_FILE%" (
    echo ❌ Error: Migration file not found: %MIGRATION_FILE%
    exit /b 1
)

echo 🔍 Trying to connect to database...
echo.

REM Try with pooler on port 6543
echo Trying: aws-0-ap-southeast-2.pooler.supabase.com:6543...
docker run --rm -i postgres:15 psql "postgresql://%DB_USER%:%DB_PASSWORD%@aws-0-ap-southeast-2.pooler.supabase.com:6543/%DB_NAME%" < "%MIGRATION_FILE%" 2>&1

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Migration applied successfully!
    echo.
    echo Next step: Run seed script
    echo   npm run db:seed
    exit /b 0
)

echo ❌ Failed with pooler, trying direct connection...
echo.

REM Try direct connection on port 5432
echo Trying: db.qohyutlxwekppkrdlamp.supabase.co:5432...
docker run --rm -i postgres:15 psql "postgresql://%DB_USER%:%DB_PASSWORD%@db.qohyutlxwekppkrdlamp.supabase.co:5432/%DB_NAME%" < "%MIGRATION_FILE%" 2>&1

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Migration applied successfully!
    echo.
    echo Next step: Run seed script
    echo   npm run db:seed
    exit /b 0
)

echo.
echo ❌ Could not connect to database
echo.
echo 📋 Manual Steps:
echo 1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/qohyutlxwekppkrdlamp
echo 2. Check if project is paused - unpause if needed
echo 3. Go to Settings -^> Database
echo 4. Copy the Connection String
echo 5. Use Supabase SQL Editor instead:
echo    https://supabase.com/dashboard/project/qohyutlxwekppkrdlamp/sql
echo.
echo 6. Copy contents of: %MIGRATION_FILE%
echo 7. Paste and Run in SQL Editor
echo.
exit /b 1
