#!/bin/bash

# Create all necessary directories
mkdir -p src/app/api/performers/\[id\]/availability
mkdir -p src/app/api/me/availability
mkdir -p src/app/api/bookings/\[id\]/{admin-approve,performer-respond}
mkdir -p src/app/api/payments/\[bookingId\]/deposit/upload
mkdir -p src/app/api/payments/deposit
mkdir -p src/app/api/vetting
mkdir -p src/app/api/admin/{overview,audit,bookings,performers/\[id\],vetting/\[id\]/decision,dns/\[id\],settings}
mkdir -p src/app/api/webhooks/twilio
mkdir -p src/app/api/cron

# Create empty files
touch src/app/api/performers/\[id\]/route.ts
touch src/app/api/performers/\[id\]/availability/route.ts
touch src/app/api/me/availability/toggle/route.ts
touch src/app/api/me/availability/blocks/route.ts
touch src/app/api/payments/config/route.ts

echo "Directories and files created"
