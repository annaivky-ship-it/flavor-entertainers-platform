# Platform Integrations

This directory contains integrations with external services for the Flavor Entertainers platform.

## Structure

```
integrations/
├── twilio/
│   └── index.ts    # WhatsApp messaging via Twilio
└── email/
    └── index.ts    # Transactional emails via Resend
```

## Quick Start

### 1. Install Dependencies

```bash
npm install resend  # Email integration
# twilio is already installed
```

### 2. Configure Environment Variables

Add to `.env.local`:

```env
# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886
ADMIN_WHATSAPP=+61400000000

# Resend
RESEND_API_KEY=re_your_api_key
ADMIN_EMAIL=admin@flavorentertainers.com.au
FROM_EMAIL=bookings@flavorentertainers.com.au
```

### 3. Test Integrations

```bash
npm run test:integrations        # Test all
npm run test:integrations:twilio # Test WhatsApp only
npm run test:integrations:email  # Test email only
```

## Usage Examples

### WhatsApp Notifications

```typescript
import { notifyBookingCreated, sendWhatsApp } from '@/integrations/twilio';

// Send custom message
await sendWhatsApp('+61400000000', 'Hello from Flavor Entertainers!');

// Send booking notification
await notifyBookingCreated(booking, client, performer);
```

### Email Notifications

```typescript
import { sendBookingConfirmationEmail, sendOTPEmail } from '@/integrations/email';

// Send booking confirmation
await sendBookingConfirmationEmail(booking, client, performer);

// Send OTP
await sendOTPEmail('user@example.com', '123456', 10);
```

## Available Functions

### Twilio (WhatsApp)

- `sendWhatsApp(to, message)` - Send WhatsApp message
- `notifyBookingCreated()` - New booking notification
- `notifyBookingApproved()` - Admin approval notification
- `notifyDepositUploaded()` - Deposit upload notification
- `notifyDepositVerified()` - Deposit verification notification
- `notifyBookingAccepted()` - Performer acceptance notification
- `sendBookingReminder()` - Event reminder (24h before)
- `notifyBookingCancelled()` - Cancellation notification
- `parseWhatsAppCommand()` - Parse incoming commands

### Email (Resend)

- `sendEmail()` - Send custom email
- `sendBookingConfirmationEmail()` - Booking confirmation
- `sendOTPEmail()` - OTP verification
- `sendVettingApprovalEmail()` - Vetting decision
- `sendBookingReminderEmail()` - Event reminder
- `getBookingConfirmationEmail()` - Get HTML template
- `getOTPEmail()` - Get OTP HTML template
- `getVettingApprovalEmail()` - Get vetting HTML template

## Error Handling

All functions return a result object with:

```typescript
{
  success: boolean;
  messageId?: string;  // If successful
  error?: string;      // If failed
}
```

Example:

```typescript
const result = await sendWhatsApp('+61400000000', 'Test');

if (result.success) {
  console.log('Sent:', result.messageId);
} else {
  console.error('Failed:', result.error);
}
```

## Rate Limits

Be aware of service rate limits:

- **Twilio**: Varies by plan (typically 200-10,000 messages/day)
- **Resend**: 100 emails/day on free tier, 50,000+ on paid plans

## Best Practices

1. ✅ Always check return values for success/failure
2. ✅ Log all message attempts for debugging
3. ✅ Handle errors gracefully (don't throw)
4. ✅ Respect user notification preferences
5. ✅ Use templates for consistency
6. ✅ Test with real phone numbers before production
7. ✅ Monitor rate limits and quotas

## Troubleshooting

### WhatsApp Not Working

- Check Twilio console for errors
- Verify phone number format includes country code
- Ensure numbers are verified in sandbox mode
- Check account balance/credits

### Emails Not Sending

- Verify domain in Resend dashboard
- Check API key is correct
- Review Resend logs for bounces
- Ensure FROM_EMAIL is from verified domain

## Documentation

See [INTEGRATIONS_AND_JOBS_GUIDE.md](../../INTEGRATIONS_AND_JOBS_GUIDE.md) for complete documentation.
