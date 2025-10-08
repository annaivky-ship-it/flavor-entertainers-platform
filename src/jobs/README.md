# Background Jobs

This directory contains automated background jobs for the Flavor Entertainers platform.

## Structure

```
jobs/
├── cleanup.ts      # Data cleanup and maintenance
└── reminders.ts    # Automated reminders
```

## Jobs Overview

### Cleanup Jobs (`cleanup.ts`)

Automated maintenance tasks to keep the database clean and performant.

#### Available Functions

- `cleanupStaleBookings()` - Cancel bookings without deposit after 24h
- `cleanupOldNotifications()` - Delete read notifications older than 30 days
- `cleanupExpiredOTPs()` - Remove expired OTP codes
- `cleanupOldAuditLogs()` - Delete old audit logs (except critical events)
- `runAllCleanupJobs()` - Run all cleanup tasks

**Schedule**: Daily at 2:00 AM (via cron)

### Reminder Jobs (`reminders.ts`)

Automated reminder notifications for bookings and payments.

#### Available Functions

- `sendBookingReminders()` - Send 24h event reminders via WhatsApp + email
- `sendPaymentReminders()` - Remind about outstanding balance (3 days before)
- `runAllReminderJobs()` - Run all reminder tasks

**Schedule**: Every hour (via cron)

## Manual Execution

### Run Individual Jobs

```typescript
import { cleanupStaleBookings } from '@/jobs/cleanup';
import { sendBookingReminders } from '@/jobs/reminders';

// Run cleanup
const cleanupResult = await cleanupStaleBookings();
console.log(`Cancelled ${cleanupResult.cancelledCount} bookings`);

// Run reminders
const reminderResult = await sendBookingReminders();
console.log(`Sent ${reminderResult.remindersSent} reminders`);
```

### Run All Jobs

```typescript
import { runAllCleanupJobs } from '@/jobs/cleanup';
import { runAllReminderJobs } from '@/jobs/reminders';

// Run all cleanup jobs
const cleanupResults = await runAllCleanupJobs();

// Run all reminder jobs
const reminderResults = await runAllReminderJobs();
```

## Return Values

All job functions return a consistent structure:

```typescript
{
  success: boolean;        // Overall success
  cancelledCount?: number; // For cleanup jobs
  deletedCount?: number;   // For cleanup jobs
  remindersSent?: number;  // For reminder jobs
  errors: string[];        // Array of error messages
}
```

## Cron Endpoints

Jobs are automatically executed via Vercel Cron:

### Cleanup Endpoint

**URL**: `/api/cron/cleanup`
**Schedule**: Daily at 2:00 AM
**Method**: GET
**Auth**: Bearer token (CRON_SECRET)

```bash
curl -H "Authorization: Bearer your_secret" \
     https://your-domain.com/api/cron/cleanup
```

### Reminders Endpoint

**URL**: `/api/cron/reminders`
**Schedule**: Every hour
**Method**: GET
**Auth**: Bearer token (CRON_SECRET)

```bash
curl -H "Authorization: Bearer your_secret" \
     https://your-domain.com/api/cron/reminders
```

## Configuration

### Environment Variables

```env
# Required for jobs to work
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Required for cron endpoints
CRON_SECRET=your_random_secret

# Required for notifications
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886
RESEND_API_KEY=re_your_api_key
```

### Vercel Cron Configuration

Configured in `vercel.json`:

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

## How Jobs Work

### Cleanup Flow

1. **Find stale data** - Query database for expired/old records
2. **Process each item** - Cancel, delete, or archive as appropriate
3. **Send notifications** - Notify affected users if needed
4. **Log operations** - Create audit trail
5. **Return results** - Report success/failure counts

### Reminder Flow

1. **Find upcoming events** - Query bookings in next 24 hours
2. **Check for duplicates** - Prevent sending multiple reminders
3. **Send notifications** - WhatsApp + Email
4. **Create records** - Store notification in database
5. **Log operations** - Create audit trail
6. **Return results** - Report reminder counts

## Error Handling

Jobs use graceful error handling:

- ✅ Errors don't stop entire job execution
- ✅ Each item processed independently
- ✅ Errors collected and reported
- ✅ Partial success is possible
- ✅ All operations logged for debugging

Example:

```typescript
const result = await cleanupStaleBookings();

if (result.success) {
  console.log('✅ All bookings cleaned up');
} else {
  console.log(`⚠️  Cleaned ${result.cancelledCount} bookings with ${result.errors.length} errors`);
  result.errors.forEach(error => console.error(error));
}
```

## Database Requirements

Jobs expect these tables to exist:

- `bookings` - Main bookings table
- `clients` - Client information
- `performers` - Performer information
- `notifications` - User notifications
- `otp_codes` - OTP verification codes (optional)
- `audit_logs` - Audit trail (optional)

## Monitoring

### Check Cron Logs

**Vercel Dashboard**:
1. Go to project → Deployments
2. Click on latest deployment
3. View Functions tab
4. Check cron function logs

**Local Testing**:
```bash
npm run test:integrations
```

### View Results

Check the API response for execution summary:

```json
{
  "success": true,
  "timestamp": "2025-10-07T02:00:00.000Z",
  "summary": {
    "staleBookings": { "cancelled": 3, "errors": [] },
    "notifications": { "deleted": 150, "errors": [] }
  }
}
```

## Customization

### Adjust Timings

Edit the functions to change when actions occur:

```typescript
// In cleanup.ts - Change 24h to 48h
const cutoffTime = new Date();
cutoffTime.setHours(cutoffTime.getHours() - 48); // Was -24

// In reminders.ts - Change 24h to 12h
const windowStart = new Date(now);
windowStart.setHours(windowStart.getHours() + 11); // Was +23
```

### Adjust Schedules

Edit `vercel.json` to change cron schedules:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 3 * * *"  // 3 AM instead of 2 AM
    },
    {
      "path": "/api/cron/reminders",
      "schedule": "*/30 * * * *"  // Every 30 minutes
    }
  ]
}
```

Cron schedule format: `minute hour day month dayOfWeek`

## Testing

### Test Specific Jobs

```typescript
// Test cleanup (safe - uses OTPs only)
import { cleanupExpiredOTPs } from '@/jobs/cleanup';
const result = await cleanupExpiredOTPs();

// Test reminders (safe - only sends if bookings exist)
import { sendBookingReminders } from '@/jobs/reminders';
const result = await sendBookingReminders();
```

### Test via API

```bash
# Local testing
curl -H "Authorization: Bearer test_secret" \
     http://localhost:3000/api/cron/cleanup

# Production testing (use with caution)
curl -H "Authorization: Bearer production_secret" \
     https://your-domain.com/api/cron/cleanup
```

## Best Practices

1. ✅ Run cleanup during low-traffic hours (2-4 AM)
2. ✅ Run reminders frequently to catch all bookings
3. ✅ Monitor logs regularly for errors
4. ✅ Test jobs in staging before production
5. ✅ Keep CRON_SECRET secure
6. ✅ Set up alerts for job failures
7. ✅ Review cleanup before enabling on production data
8. ✅ Adjust retention periods based on business needs

## Troubleshooting

### Jobs Not Running

- Check Vercel cron configuration is active
- Verify CRON_SECRET is set correctly
- Test endpoints manually
- Check Vercel deployment logs

### Jobs Failing

- Review error messages in response
- Check environment variables are set
- Verify database tables exist
- Test integrations (Twilio, Resend) separately

### Notifications Not Sending

- Check integration configurations
- Verify phone numbers/emails are valid
- Review rate limits on Twilio/Resend
- Check integration logs

## Documentation

See [INTEGRATIONS_AND_JOBS_GUIDE.md](../../INTEGRATIONS_AND_JOBS_GUIDE.md) for complete documentation.
