# Integration Setup Checklist

Quick checklist for setting up integrations and background jobs for the Flavor Entertainers platform.

## Pre-Deployment Checklist

### 1. Install Dependencies

- [ ] Run `npm install resend`
- [ ] Verify Twilio is already installed (check package.json)

### 2. Twilio Setup

- [ ] Create Twilio account at https://www.twilio.com
- [ ] Navigate to Console Dashboard
- [ ] Copy Account SID
- [ ] Copy Auth Token
- [ ] Enable WhatsApp messaging
- [ ] Get your WhatsApp sender number (e.g., +14155238886)
- [ ] Test WhatsApp sandbox with your phone number

### 3. Resend Setup

- [ ] Create Resend account at https://resend.com
- [ ] Add and verify your domain (or use test domain)
- [ ] Navigate to API Keys
- [ ] Create new API key
- [ ] Copy the API key (starts with `re_`)

### 4. Environment Variables

Add to `.env.local`:

```env
# Twilio
TWILIO_ACCOUNT_SID=AC...                    # From Twilio console
TWILIO_AUTH_TOKEN=...                       # From Twilio console
TWILIO_WHATSAPP_NUMBER=+14155238886         # Your Twilio WhatsApp number
ADMIN_WHATSAPP=+61400000000                 # Admin's WhatsApp number

# Resend
RESEND_API_KEY=re_...                       # From Resend dashboard
ADMIN_EMAIL=admin@flavorentertainers.com.au
FROM_EMAIL=bookings@flavorentertainers.com.au

# Cron Security
CRON_SECRET=<generate random 32+ char string>

# App
NEXT_PUBLIC_APP_URL=https://flavorentertainers.com.au
```

- [ ] All Twilio variables set
- [ ] All Resend variables set
- [ ] CRON_SECRET generated (use: `openssl rand -hex 32`)
- [ ] App URL configured

### 5. Local Testing

- [ ] Run `npm run test:integrations`
- [ ] Verify WhatsApp test message received
- [ ] Verify test email received
- [ ] Check console for any errors
- [ ] Test cleanup job (safe - uses OTPs only)

### 6. Code Integration

Add integration calls to your existing code:

**In booking creation** (`src/app/api/bookings/route.ts` or similar):
```typescript
import { notifyBookingCreated } from '@/integrations/twilio';
import { sendBookingConfirmationEmail } from '@/integrations/email';

// After booking created
await notifyBookingCreated(booking, client, performer);
await sendBookingConfirmationEmail(booking, client, performer);
```

**In deposit verification** (`src/app/api/admin/verify-deposit/route.ts` or similar):
```typescript
import { notifyDepositVerified } from '@/integrations/twilio';

// After admin verifies deposit
await notifyDepositVerified(booking, client, performer);
```

**In vetting approval** (`src/app/api/vetting/approve/route.ts` or similar):
```typescript
import { sendVettingApprovalEmail } from '@/integrations/email';

// After vetting decision
await sendVettingApprovalEmail(application, approved, notes);
```

- [ ] Added to booking creation flow
- [ ] Added to deposit verification flow
- [ ] Added to vetting approval flow
- [ ] Added to booking acceptance flow
- [ ] Added to cancellation flow

### 7. Vercel Deployment Setup

- [ ] Verify `vercel.json` has cron configuration
- [ ] Add all environment variables to Vercel:

```bash
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_AUTH_TOKEN
vercel env add TWILIO_WHATSAPP_NUMBER
vercel env add ADMIN_WHATSAPP
vercel env add RESEND_API_KEY
vercel env add ADMIN_EMAIL
vercel env add FROM_EMAIL
vercel env add CRON_SECRET
vercel env add NEXT_PUBLIC_APP_URL
```

- [ ] All variables added for Production environment
- [ ] All variables added for Preview environment (optional)
- [ ] All variables added for Development environment (optional)

### 8. Deploy to Production

- [ ] Run `npm run deploy` or push to main branch
- [ ] Wait for deployment to complete
- [ ] Check deployment logs for any errors

### 9. Verify Cron Jobs

- [ ] Go to Vercel project dashboard
- [ ] Navigate to Settings → Cron Jobs
- [ ] Verify "Cleanup Job" is listed (schedule: 0 2 * * *)
- [ ] Verify "Reminders Job" is listed (schedule: 0 * * * *)
- [ ] Both jobs show as "Active"

### 10. Post-Deployment Testing

Test cron endpoints manually:

```bash
# Test cleanup endpoint
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://your-domain.com/api/cron/cleanup

# Test reminders endpoint
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://your-domain.com/api/cron/reminders
```

- [ ] Cleanup endpoint returns 200 OK
- [ ] Reminders endpoint returns 200 OK
- [ ] Check response JSON for success
- [ ] Review Vercel function logs

### 11. Production Verification (24 hours later)

- [ ] Check Vercel logs for cron executions
- [ ] Verify cleanup ran at 2:00 AM
- [ ] Verify reminders ran every hour
- [ ] Check for any errors in logs
- [ ] Verify notifications were sent (if applicable)

### 12. Monitoring Setup

- [ ] Set up alerts for cron job failures (optional)
- [ ] Monitor Twilio usage/credits
- [ ] Monitor Resend usage/limits
- [ ] Create dashboard for job statistics (optional)

## Quick Reference

### Test Commands

```bash
# Test all integrations
npm run test:integrations

# Test specific integration
npm run test:integrations:twilio
npm run test:integrations:email

# Test cron endpoints (local)
curl -H "Authorization: Bearer test_secret" http://localhost:3000/api/cron/cleanup
curl -H "Authorization: Bearer test_secret" http://localhost:3000/api/cron/reminders
```

### Important Files

- Twilio integration: `src/integrations/twilio/index.ts`
- Email integration: `src/integrations/email/index.ts`
- Cleanup jobs: `src/jobs/cleanup.ts`
- Reminder jobs: `src/jobs/reminders.ts`
- Cleanup endpoint: `src/app/api/cron/cleanup/route.ts`
- Reminders endpoint: `src/app/api/cron/reminders/route.ts`
- Test script: `scripts/test-integrations.ts`

### Documentation

- Complete guide: `INTEGRATIONS_AND_JOBS_GUIDE.md`
- Summary: `INTEGRATIONS_SUMMARY.md`
- Integrations docs: `src/integrations/README.md`
- Jobs docs: `src/jobs/README.md`

## Troubleshooting

### WhatsApp not working?
1. Check Twilio console for errors
2. Verify phone number format (+61 for Australia)
3. Ensure numbers verified in sandbox mode
4. Check Twilio account balance

### Emails not sending?
1. Verify domain in Resend dashboard
2. Check FROM_EMAIL is from verified domain
3. Review Resend logs for errors
4. Check API key is correct

### Cron jobs not running?
1. Check Vercel cron configuration is active
2. Verify CRON_SECRET matches
3. Test endpoints manually
4. Review Vercel function logs

### Jobs failing?
1. Check all environment variables set
2. Verify database tables exist
3. Review error messages in response
4. Test integrations separately

## Need Help?

- Review: `INTEGRATIONS_AND_JOBS_GUIDE.md`
- Run: `npm run test:integrations`
- Check Vercel logs
- Contact support

---

**Last Updated**: 2025-10-07
**Status**: Ready for deployment
