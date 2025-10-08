# Integrations and Background Jobs - Implementation Summary

This document provides a summary of all integration files and background jobs created for the Flavor Entertainers platform.

## Files Created

### Integration Files

#### 1. Twilio WhatsApp Integration
**File**: `src/integrations/twilio/index.ts`

**Functions**:
- `sendWhatsApp(to, message)` - Send WhatsApp message via Twilio
- `sendAdminWhatsApp(message)` - Send message to admin
- `notifyBookingCreated(booking, client, performer)` - Notify about new booking
- `notifyBookingApproved(booking, client, performer)` - Notify about admin approval
- `notifyDepositUploaded(booking, client, performer)` - Notify about deposit upload
- `notifyDepositVerified(booking, client, performer)` - Notify about deposit verification
- `notifyBookingAccepted(booking, client, performer)` - Notify about performer acceptance
- `sendBookingReminder(booking, client, performer, hoursUntilEvent)` - Send event reminder
- `notifyBookingCancelled(booking, client, performer, reason)` - Notify about cancellation
- `parseWhatsAppCommand(message)` - Parse incoming WhatsApp commands

**Environment Variables Required**:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_NUMBER`
- `ADMIN_WHATSAPP`

#### 2. Email Integration (Resend)
**File**: `src/integrations/email/index.ts`

**Functions**:
- `sendEmail({ to, subject, html, replyTo })` - Send email using Resend API
- `getBookingConfirmationEmail(booking, client, performer)` - Generate booking confirmation HTML
- `getOTPEmail(otp, expiryMinutes)` - Generate OTP email HTML
- `getVettingApprovalEmail(application, approved, notes)` - Generate vetting email HTML
- `sendBookingConfirmationEmail(booking, client, performer)` - Send booking confirmation
- `sendOTPEmail(email, otp, expiryMinutes)` - Send OTP
- `sendVettingApprovalEmail(application, approved, notes)` - Send vetting decision
- `sendBookingReminderEmail(booking, client, performer, hoursUntilEvent)` - Send reminder

**Environment Variables Required**:
- `RESEND_API_KEY`
- `ADMIN_EMAIL`
- `FROM_EMAIL` (optional, defaults to bookings@flavorentertainers.com.au)

**Note**: Requires `npm install resend`

### Background Jobs

#### 3. Cleanup Jobs
**File**: `src/jobs/cleanup.ts`

**Functions**:
- `cleanupStaleBookings()` - Cancel bookings without deposit after 24 hours
- `cleanupOldNotifications()` - Delete read notifications older than 30 days
- `cleanupExpiredOTPs()` - Remove expired OTP codes
- `cleanupOldAuditLogs()` - Delete non-critical audit logs older than 90 days
- `runAllCleanupJobs()` - Execute all cleanup tasks

**Features**:
- Sends cancellation notifications for stale bookings
- Creates audit log entries for all operations
- Graceful error handling - partial failures don't stop execution
- Returns detailed results with counts and errors

#### 4. Reminder Jobs
**File**: `src/jobs/reminders.ts`

**Functions**:
- `sendBookingReminders()` - Send 24-hour event reminders via WhatsApp and email
- `sendPaymentReminders()` - Send payment reminders 3 days before event
- `runAllReminderJobs()` - Execute all reminder tasks

**Features**:
- Dual-channel notifications (WhatsApp + Email)
- Duplicate prevention (checks for recent reminders)
- Creates notification records in database
- Audit logging for all operations

### API Endpoints

#### 5. Cleanup Cron Endpoint
**File**: `src/app/api/cron/cleanup/route.ts`

**Details**:
- **Method**: GET
- **Path**: `/api/cron/cleanup`
- **Schedule**: Daily at 2:00 AM
- **Authentication**: Bearer token via `CRON_SECRET`
- **Returns**: JSON summary of cleanup operations

#### 6. Reminders Cron Endpoint
**File**: `src/app/api/cron/reminders/route.ts`

**Details**:
- **Method**: GET
- **Path**: `/api/cron/reminders`
- **Schedule**: Every hour
- **Authentication**: Bearer token via `CRON_SECRET`
- **Returns**: JSON summary of reminder operations

### Configuration Files

#### 7. Vercel Cron Configuration
**File**: `vercel.json` (updated)

**Cron Jobs**:
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/reminders",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Scripts

#### 8. Integration Test Script
**File**: `scripts/test-integrations.ts`

**Usage**:
```bash
npm run test:integrations              # Test all
npm run test:integrations:twilio      # Test WhatsApp
npm run test:integrations:email       # Test email
npx tsx scripts/test-integrations.ts cleanup    # Test cleanup
npx tsx scripts/test-integrations.ts reminders  # Test reminders
```

**Features**:
- Environment variable validation
- Individual integration testing
- Safe to run anytime
- Detailed output with status indicators

#### 9. Package.json Scripts (updated)
**File**: `package.json` (updated)

**New Scripts**:
```json
{
  "test:integrations": "npx tsx scripts/test-integrations.ts",
  "test:integrations:twilio": "npx tsx scripts/test-integrations.ts twilio",
  "test:integrations:email": "npx tsx scripts/test-integrations.ts email"
}
```

### Documentation

#### 10. Comprehensive Integration Guide
**File**: `INTEGRATIONS_AND_JOBS_GUIDE.md`

**Contents**:
- Complete setup instructions
- Environment variable documentation
- Detailed function documentation
- Testing procedures
- Troubleshooting guide
- Production deployment checklist
- Best practices

#### 11. Integrations README
**File**: `src/integrations/README.md`

**Contents**:
- Quick start guide
- Usage examples
- Function reference
- Error handling patterns
- Troubleshooting tips

#### 12. Jobs README
**File**: `src/jobs/README.md`

**Contents**:
- Job descriptions
- Scheduling information
- Manual execution examples
- Configuration guide
- Monitoring instructions

## Environment Variables Required

Create or update `.env.local` with these variables:

```env
# Twilio WhatsApp
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886
ADMIN_WHATSAPP=+61400000000

# Resend Email
RESEND_API_KEY=re_your_api_key
ADMIN_EMAIL=admin@flavorentertainers.com.au
FROM_EMAIL=bookings@flavorentertainers.com.au

# Cron Security
CRON_SECRET=your_random_secret_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://flavorentertainers.com.au

# Optional Testing
TEST_PHONE_NUMBER=+61400000000
TEST_EMAIL=test@example.com
```

## Installation Steps

### 1. Install Required Package

```bash
npm install resend
```

### 2. Configure Environment Variables

Copy the variables above to your `.env.local` file and fill in your actual values.

### 3. Set Up Twilio

1. Create account at https://www.twilio.com
2. Enable WhatsApp messaging
3. Get Account SID and Auth Token
4. Configure WhatsApp sender number
5. Add credentials to `.env.local`

### 4. Set Up Resend

1. Create account at https://resend.com
2. Verify your domain
3. Get API key
4. Add credentials to `.env.local`

### 5. Test Integrations

```bash
npm run test:integrations
```

### 6. Deploy to Vercel

```bash
# Add environment variables to Vercel
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_AUTH_TOKEN
# ... add all other variables

# Deploy
npm run deploy
```

### 7. Verify Cron Jobs

1. Go to Vercel dashboard
2. Navigate to Settings → Cron Jobs
3. Verify both jobs are listed and active

## Usage Examples

### In Booking Creation Flow

```typescript
import { notifyBookingCreated } from '@/integrations/twilio';
import { sendBookingConfirmationEmail } from '@/integrations/email';

// After booking is created
await Promise.all([
  notifyBookingCreated(booking, client, performer),
  sendBookingConfirmationEmail(booking, client, performer)
]);
```

### In Deposit Verification Flow

```typescript
import { notifyDepositVerified } from '@/integrations/twilio';

// After admin verifies deposit
await notifyDepositVerified(booking, client, performer);
```

### Manual Job Execution

```typescript
import { runAllCleanupJobs } from '@/jobs/cleanup';

// Run cleanup manually
const result = await runAllCleanupJobs();
console.log('Cleanup complete:', result);
```

## Testing

### Local Testing

```bash
# Test all integrations
npm run test:integrations

# Test specific integration
npm run test:integrations:twilio
npm run test:integrations:email

# Test cron endpoints
curl -H "Authorization: Bearer your_secret" http://localhost:3000/api/cron/cleanup
curl -H "Authorization: Bearer your_secret" http://localhost:3000/api/cron/reminders
```

### Production Testing

Use with caution - these will send real notifications:

```bash
# Test cleanup (relatively safe)
curl -H "Authorization: Bearer prod_secret" https://your-domain.com/api/cron/cleanup

# Test reminders (will send to real users if bookings exist)
curl -H "Authorization: Bearer prod_secret" https://your-domain.com/api/cron/reminders
```

## Monitoring

### Vercel Dashboard

1. Go to your project
2. Click on Deployments
3. Select latest deployment
4. View Functions tab
5. Check logs for cron executions

### Error Tracking

All jobs return detailed error arrays:

```typescript
const result = await runAllCleanupJobs();

if (!result.success || result.results.staleBookings.errors.length > 0) {
  // Send alert to monitoring system
  console.error('Cleanup errors:', result.results.staleBookings.errors);
}
```

## Architecture

### Notification Flow

```
Booking Event
    ↓
Integration Function
    ↓
    ├─→ Twilio API (WhatsApp)
    └─→ Resend API (Email)
    ↓
Create Notification Record
    ↓
Create Audit Log
    ↓
Return Result
```

### Cron Job Flow

```
Vercel Cron Trigger
    ↓
Verify CRON_SECRET
    ↓
Execute Job Function
    ↓
    ├─→ Query Database
    ├─→ Process Records
    ├─→ Send Notifications
    └─→ Create Audit Logs
    ↓
Return Summary
    ↓
Log to Vercel
```

## Next Steps

1. ✅ Install Resend: `npm install resend`
2. ✅ Configure all environment variables
3. ✅ Test integrations locally
4. ✅ Deploy to Vercel
5. ✅ Verify cron jobs are running
6. ✅ Monitor logs for first 24-48 hours
7. ✅ Set up alerts for job failures

## Support

For questions or issues:
- Review the comprehensive guide: `INTEGRATIONS_AND_JOBS_GUIDE.md`
- Check integration docs: `src/integrations/README.md`
- Check jobs docs: `src/jobs/README.md`
- Test with: `npm run test:integrations`

## License

Part of the Flavor Entertainers platform - © 2024
