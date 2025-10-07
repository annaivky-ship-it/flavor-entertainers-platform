# Integrations and Background Jobs Guide

This guide covers the integrations and background jobs setup for the Flavor Entertainers platform.

## Overview

The platform includes:
- **Twilio Integration**: WhatsApp messaging for real-time notifications
- **Email Integration**: Transactional emails using Resend
- **Background Jobs**: Automated cleanup and reminder tasks

## Installation

### Required Dependencies

The following packages are already installed:
- `twilio` - WhatsApp messaging

### Additional Required Package

Install Resend for email functionality:

```bash
npm install resend
```

## Environment Variables

Add these variables to your `.env.local` file:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886  # Your Twilio WhatsApp number
ADMIN_WHATSAPP=+61400000000          # Admin's WhatsApp number

# Resend Configuration
RESEND_API_KEY=re_your_api_key
ADMIN_EMAIL=admin@flavorentertainers.com.au
FROM_EMAIL=bookings@flavorentertainers.com.au

# Cron Job Security
CRON_SECRET=your_random_secret_key_here

# App URL
NEXT_PUBLIC_APP_URL=https://flavorentertainers.com.au
```

## File Structure

```
src/
├── integrations/
│   ├── twilio/
│   │   └── index.ts       # WhatsApp messaging functions
│   └── email/
│       └── index.ts       # Email functions using Resend
├── jobs/
│   ├── cleanup.ts         # Cleanup background jobs
│   └── reminders.ts       # Reminder background jobs
└── app/
    └── api/
        └── cron/
            ├── cleanup/
            │   └── route.ts    # Cleanup cron endpoint
            └── reminders/
                └── route.ts    # Reminders cron endpoint
```

## Twilio WhatsApp Integration

### Setup

1. Sign up for a Twilio account at https://www.twilio.com
2. Enable WhatsApp messaging in your Twilio console
3. Get your Account SID and Auth Token
4. Configure your WhatsApp sender number
5. Add credentials to `.env.local`

### Available Functions

Located in `src/integrations/twilio/index.ts`:

- `sendWhatsApp(to, message)` - Send WhatsApp message
- `sendAdminWhatsApp(message)` - Send message to admin
- `notifyBookingCreated(booking, client, performer)` - Notify all parties about new booking
- `notifyBookingApproved(booking, client, performer)` - Notify about booking approval
- `notifyDepositUploaded(booking, client, performer)` - Notify about deposit upload
- `notifyDepositVerified(booking, client, performer)` - Notify about deposit verification
- `notifyBookingAccepted(booking, client, performer)` - Notify about performer acceptance
- `sendBookingReminder(booking, client, performer, hoursUntilEvent)` - Send booking reminder
- `notifyBookingCancelled(booking, client, performer, reason)` - Notify about cancellation
- `parseWhatsAppCommand(message)` - Parse incoming WhatsApp commands

### Usage Example

```typescript
import { notifyBookingCreated } from '@/integrations/twilio';

// In your booking creation logic
await notifyBookingCreated(booking, client, performer);
```

## Email Integration (Resend)

### Setup

1. Sign up for Resend at https://resend.com
2. Verify your domain or use their test domain
3. Get your API key
4. Add credentials to `.env.local`

### Available Functions

Located in `src/integrations/email/index.ts`:

- `sendEmail({ to, subject, html, replyTo })` - Send email
- `getBookingConfirmationEmail(booking, client, performer)` - Get booking confirmation HTML
- `getOTPEmail(otp, expiryMinutes)` - Get OTP email HTML
- `getVettingApprovalEmail(application, approved, notes)` - Get vetting email HTML
- `sendBookingConfirmationEmail(booking, client, performer)` - Send booking confirmation
- `sendOTPEmail(email, otp, expiryMinutes)` - Send OTP
- `sendVettingApprovalEmail(application, approved, notes)` - Send vetting decision
- `sendBookingReminderEmail(booking, client, performer, hoursUntilEvent)` - Send reminder

### Usage Example

```typescript
import { sendBookingConfirmationEmail } from '@/integrations/email';

// After booking is confirmed
await sendBookingConfirmationEmail(booking, client, performer);
```

## Background Jobs

### Cleanup Jobs

Located in `src/jobs/cleanup.ts`:

#### `cleanupStaleBookings()`
- Cancels bookings pending for >24 hours without deposit
- Sends cancellation notifications
- Creates audit log entries

#### `cleanupOldNotifications()`
- Deletes read notifications older than 30 days
- Keeps the notifications table manageable

#### `cleanupExpiredOTPs()`
- Removes expired OTP codes
- Keeps security codes fresh

#### `cleanupOldAuditLogs()`
- Deletes non-critical audit logs older than 90 days
- Retains security/fraud/dispute logs indefinitely

#### `runAllCleanupJobs()`
- Runs all cleanup tasks in sequence
- Returns comprehensive results

### Reminder Jobs

Located in `src/jobs/reminders.ts`:

#### `sendBookingReminders()`
- Sends reminders 24 hours before events
- Uses both WhatsApp and email
- Creates notification records
- Prevents duplicate reminders

#### `sendPaymentReminders()`
- Reminds clients about outstanding balance
- Sends 3 days before event
- Only for deposit-paid bookings

#### `runAllReminderJobs()`
- Runs all reminder tasks in sequence
- Returns comprehensive results

### Usage Example

```typescript
import { runAllCleanupJobs } from '@/jobs/cleanup';
import { runAllReminderJobs } from '@/jobs/reminders';

// Run manually or via cron
const cleanupResults = await runAllCleanupJobs();
const reminderResults = await runAllReminderJobs();
```

## Cron Jobs

### Vercel Cron Configuration

The `vercel.json` file is configured with two cron jobs:

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

### Schedules

- **Cleanup**: Daily at 2:00 AM (server time)
- **Reminders**: Every hour

### Security

Both cron endpoints require authentication:

```bash
# Set a random secret in .env.local
CRON_SECRET=your_random_secret_key

# Cron service must send this header:
Authorization: Bearer your_random_secret_key
```

### API Endpoints

#### GET `/api/cron/cleanup`

Runs all cleanup jobs and returns results:

```json
{
  "success": true,
  "timestamp": "2025-10-07T02:00:00.000Z",
  "summary": {
    "staleBookings": {
      "cancelled": 3,
      "errors": []
    },
    "notifications": {
      "deleted": 150,
      "errors": []
    },
    "otps": {
      "deleted": 25,
      "errors": []
    },
    "auditLogs": {
      "deleted": 500,
      "errors": []
    }
  }
}
```

#### GET `/api/cron/reminders`

Runs all reminder jobs and returns results:

```json
{
  "success": true,
  "timestamp": "2025-10-07T12:00:00.000Z",
  "summary": {
    "bookingReminders": {
      "sent": 5,
      "errors": []
    },
    "paymentReminders": {
      "sent": 3,
      "errors": []
    }
  }
}
```

## Testing

### Manual Testing

You can test the cron endpoints locally:

```bash
# Test cleanup job
curl -H "Authorization: Bearer your_secret" http://localhost:3000/api/cron/cleanup

# Test reminders job
curl -H "Authorization: Bearer your_secret" http://localhost:3000/api/cron/reminders
```

### Integration Testing

Test individual functions:

```typescript
// Test WhatsApp
import { sendWhatsApp } from '@/integrations/twilio';
await sendWhatsApp('+61400000000', 'Test message');

// Test Email
import { sendEmail } from '@/integrations/email';
await sendEmail({
  to: 'test@example.com',
  subject: 'Test',
  html: '<p>Test email</p>'
});

// Test Cleanup
import { cleanupStaleBookings } from '@/jobs/cleanup';
const result = await cleanupStaleBookings();
console.log(result);

// Test Reminders
import { sendBookingReminders } from '@/jobs/reminders';
const result = await sendBookingReminders();
console.log(result);
```

## Database Requirements

The background jobs expect these tables to exist:

- `bookings` - Main bookings table
- `clients` - Client information
- `performers` - Performer information
- `notifications` - User notifications
- `otp_codes` - OTP verification codes (optional)
- `audit_logs` - Audit trail

Make sure your Supabase database schema includes these tables.

## Monitoring

### Logs

All jobs log their operations:
- Start/completion messages
- Success/error counts
- Individual operation results

Check your Vercel deployment logs or local console output.

### Error Handling

All functions include comprehensive error handling:
- Try-catch blocks around operations
- Error collection and reporting
- Graceful degradation (partial failures don't stop entire job)
- Audit log entries for tracking

### Notifications

Failed operations are logged but don't stop execution. Review logs regularly to catch issues.

## Production Deployment

### Checklist

1. ✅ Install Resend: `npm install resend`
2. ✅ Set all environment variables in Vercel
3. ✅ Verify domain in Resend (for email)
4. ✅ Set up Twilio WhatsApp sandbox or production number
5. ✅ Generate and set CRON_SECRET
6. ✅ Test both cron endpoints
7. ✅ Verify Vercel cron configuration is active
8. ✅ Monitor logs after first cron runs

### Vercel Cron Setup

Vercel Cron is automatically configured via `vercel.json`. After deployment:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Cron Jobs
3. Verify both jobs are listed and active
4. Check execution logs

### Alternative: GitHub Actions

If not using Vercel, you can use GitHub Actions:

```yaml
# .github/workflows/cron-jobs.yml
name: Cron Jobs

on:
  schedule:
    - cron: '0 2 * * *'  # Cleanup at 2 AM
    - cron: '0 * * * *'  # Reminders every hour

jobs:
  run-jobs:
    runs-on: ubuntu-latest
    steps:
      - name: Run Cleanup
        if: github.event.schedule == '0 2 * * *'
        run: |
          curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
               https://your-domain.com/api/cron/cleanup

      - name: Run Reminders
        if: github.event.schedule == '0 * * * *'
        run: |
          curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
               https://your-domain.com/api/cron/reminders
```

## Troubleshooting

### WhatsApp Messages Not Sending

- Verify Twilio credentials
- Check WhatsApp number format (must include country code)
- Ensure phone numbers are verified in Twilio sandbox (if using sandbox)
- Check Twilio console for error messages

### Emails Not Sending

- Verify Resend API key
- Check domain verification status in Resend
- Review Resend dashboard for bounce/error logs
- Verify FROM_EMAIL is from verified domain

### Cron Jobs Not Running

- Check Vercel cron configuration
- Verify endpoints are accessible (test manually)
- Check CRON_SECRET is set correctly
- Review Vercel deployment logs

### Jobs Failing

- Check environment variables are set
- Verify database tables exist
- Review error messages in logs
- Test individual functions manually

## Best Practices

1. **Environment Variables**: Never commit secrets to git
2. **Error Handling**: Always handle errors gracefully
3. **Logging**: Log all operations for debugging
4. **Testing**: Test integrations before deploying
5. **Monitoring**: Regularly check logs for issues
6. **Rate Limits**: Be aware of Twilio/Resend rate limits
7. **Security**: Always use CRON_SECRET for cron endpoints
8. **Notifications**: Don't spam users - respect notification preferences

## Support

For issues or questions:
- Review logs first
- Check environment variables
- Test integrations individually
- Contact support@flavorentertainers.com.au
