# Backend Deployment Guide

Complete guide to deploying the Flavor Entertainers Platform backend to Vercel.

## Prerequisites

- Vercel account connected to your GitHub repository
- Supabase project created
- PostgreSQL database accessible
- Twilio account (optional, for WhatsApp notifications)
- Resend account (optional, for email notifications)

## Step 1: Database Setup

### 1.1 Supabase Configuration

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Copy your connection string (starts with `postgresql://`)
4. Get your Service Role Key from **Settings** → **API**

### 1.2 Run Database Migrations

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# OR run migrations
npm run db:migrate:deploy
```

### 1.3 Seed Database (Optional)

```bash
npm run db:seed
```

This will create:
- 2 admin users
- 6 verified performers
- 10 services
- System settings

## Step 2: Environment Variables

### 2.1 Required Variables

Add these environment variables to your Vercel project:

#### Database
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.qohyutlxwekppkrdlamp.supabase.co:5432/postgres
```

#### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://qohyutlxwekppkrdlamp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### Authentication
```
JWT_SECRET=your_random_jwt_secret_min_32_characters
```

#### Application
```
NEXT_PUBLIC_APP_URL=https://booking-system-lrkd.vercel.app
NODE_ENV=production
```

### 2.2 Optional Variables (Integrations)

#### Twilio WhatsApp
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886
ADMIN_WHATSAPP=whatsapp:+61470253286
```

#### Resend Email
```
RESEND_API_KEY=re_your_api_key
ADMIN_EMAIL=contact@lustandlace.com.au
FROM_EMAIL=bookings@lustandlace.com.au
```

#### Cron Security
```
CRON_SECRET=your_random_cron_secret
```

#### PayID
```
PAYID_ALIAS=annaivky@gmail.com
PAYID_REFERENCE_PREFIX=BK
```

## Step 3: Vercel Deployment

### 3.1 Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New Project**
3. Import your GitHub repository
4. Select the repository: `flavor-entertainers-platform`

### 3.2 Configure Build Settings

Vercel will auto-detect Next.js, but verify:

- **Framework Preset**: Next.js
- **Build Command**: `npm install && prisma generate && npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 3.3 Add Environment Variables

1. In Vercel project settings
2. Go to **Settings** → **Environment Variables**
3. Add all required variables from Step 2.1
4. Add optional variables if using integrations

### 3.4 Deploy

1. Click **Deploy**
2. Wait for deployment to complete (2-5 minutes)
3. Visit your deployment URL

## Step 4: Verify Deployment

### 4.1 Check API Health

```bash
# Test API is responding
curl https://your-domain.vercel.app/api/me

# Should return 401 (Unauthorized) if not authenticated
# This means the API is working!
```

### 4.2 Test Database Connection

```bash
# Test services endpoint
curl https://your-domain.vercel.app/api/services

# Should return list of services
```

### 4.3 Check Cron Jobs

1. Go to Vercel project dashboard
2. Navigate to **Settings** → **Cron Jobs**
3. Verify both cron jobs are listed:
   - `/api/cron/cleanup` - Daily at 2 AM
   - `/api/cron/reminders` - Every 6 hours

## Step 5: Post-Deployment Setup

### 5.1 Create Admin User

```bash
# Using Prisma Studio (locally)
npm run db:studio

# Or run seed script
npm run db:seed
```

### 5.2 Upload Performer Images

1. Log in as performer
2. Navigate to profile settings
3. Upload profile image and gallery images

### 5.3 Configure System Settings

1. Log in as admin
2. Go to Admin Dashboard → Settings
3. Configure:
   - Deposit percentage (default: 50%)
   - Payment methods
   - Notification preferences

## Step 6: Integration Setup (Optional)

### 6.1 Twilio WhatsApp

1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to **Messaging** → **Try it out** → **Send a WhatsApp message**
3. Follow setup wizard
4. Get your Account SID and Auth Token
5. Add to Vercel environment variables
6. Test: `npm run test:integrations:twilio`

### 6.2 Resend Email

1. Go to [Resend Dashboard](https://resend.com)
2. Create new API key
3. Verify your domain
4. Add API key to Vercel environment variables
5. Test: `npm run test:integrations:email`

## Troubleshooting

### Database Connection Issues

**Problem**: `Can't reach database server`

**Solution**:
1. Check DATABASE_URL is correct
2. Verify database is accessible from Vercel IPs
3. Check Supabase project is not paused
4. Ensure connection pooling is enabled

### Prisma Generate Fails

**Problem**: `@prisma/client did not initialize yet`

**Solution**:
```bash
# Redeploy with build command
npm install && prisma generate && npm run build
```

### API Routes Return 500

**Problem**: Internal server error on API routes

**Solution**:
1. Check Vercel logs: `vercel logs`
2. Verify all required env variables are set
3. Check Prisma client is generated
4. Review error messages in logs

### Cron Jobs Not Running

**Problem**: Scheduled tasks not executing

**Solution**:
1. Verify `CRON_SECRET` is set
2. Check cron job configuration in Vercel dashboard
3. Review execution logs in Vercel

## Environment-Specific Notes

### Development
```bash
# Copy .env.backend to .env.local
cp .env.backend .env.local

# Update with local values
# Run locally
npm run dev
```

### Staging
- Use separate Supabase project for staging
- Set `NODE_ENV=staging`
- Use test Twilio/Resend accounts

### Production
- Use production Supabase project
- Set `NODE_ENV=production`
- Use production Twilio/Resend accounts
- Enable all security features

## Security Checklist

- [ ] DATABASE_URL uses strong password
- [ ] JWT_SECRET is minimum 32 random characters
- [ ] SUPABASE_SERVICE_ROLE_KEY is kept secret
- [ ] CRON_SECRET is set and random
- [ ] All API keys are production keys
- [ ] Row Level Security (RLS) enabled in Supabase
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] File upload limits set

## Monitoring & Logs

### Vercel Logs
```bash
# Real-time logs
vercel logs --follow

# Filter by function
vercel logs --function api/bookings
```

### Database Logs
1. Go to Supabase Dashboard
2. Navigate to **Database** → **Logs**
3. Filter by severity and timestamp

### Audit Logs
Access via Admin Dashboard → Audit Log

## Backup Strategy

### Database Backups
- Supabase provides daily automated backups
- Manual backup: Supabase Dashboard → Database → Backups

### Code Backups
- All code in GitHub
- Vercel maintains deployment history

## Scaling Considerations

### Database
- Monitor connection pool usage
- Consider upgrading Supabase plan if needed
- Add read replicas for heavy read workloads

### API
- Vercel automatically scales serverless functions
- Monitor function execution time
- Consider edge functions for global performance

### File Storage
- Supabase Storage has 1GB free tier
- Upgrade plan as needed
- Consider CDN for images

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs

## Next Steps

After successful deployment:

1. ✅ Test all API endpoints
2. ✅ Create admin account
3. ✅ Upload test data
4. ✅ Configure integrations
5. ✅ Set up monitoring
6. ✅ Test booking flow end-to-end
7. ✅ Review security settings
8. ✅ Set up backup strategy

**Your backend is now deployed and ready to use!** 🎉
