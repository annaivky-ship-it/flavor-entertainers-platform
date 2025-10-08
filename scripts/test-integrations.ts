/**
 * Test script for integrations and background jobs
 * Run with: npx tsx scripts/test-integrations.ts
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testTwilioIntegration() {
  console.log('\n📱 Testing Twilio WhatsApp Integration...\n');

  try {
    const { sendWhatsApp } = await import('../src/integrations/twilio');

    // Test sending a simple message
    const testNumber = process.env.TEST_PHONE_NUMBER || process.env.ADMIN_WHATSAPP;

    if (!testNumber) {
      console.log('⚠️  No test phone number set. Set TEST_PHONE_NUMBER or ADMIN_WHATSAPP in .env.local');
      return;
    }

    console.log(`Sending test message to ${testNumber}...`);

    const result = await sendWhatsApp(
      testNumber,
      '🧪 Test message from Flavor Entertainers platform. Integration is working!'
    );

    if (result.success) {
      console.log('✅ WhatsApp message sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
    } else {
      console.log('❌ Failed to send WhatsApp message');
      console.log(`   Error: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Twilio integration test failed:', error);
  }
}

async function testEmailIntegration() {
  console.log('\n📧 Testing Email Integration...\n');

  try {
    const { sendEmail, getOTPEmail } = await import('../src/integrations/email');

    const testEmail = process.env.TEST_EMAIL || process.env.ADMIN_EMAIL;

    if (!testEmail) {
      console.log('⚠️  No test email set. Set TEST_EMAIL or ADMIN_EMAIL in .env.local');
      return;
    }

    console.log(`Sending test email to ${testEmail}...`);

    const html = getOTPEmail('123456', 10);

    const result = await sendEmail({
      to: testEmail,
      subject: '🧪 Test Email - Flavor Entertainers',
      html,
    });

    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
    } else {
      console.log('❌ Failed to send email');
      console.log(`   Error: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Email integration test failed:', error);
  }
}

async function testCleanupJobs() {
  console.log('\n🧹 Testing Cleanup Jobs...\n');

  try {
    const { cleanupExpiredOTPs } = await import('../src/jobs/cleanup');

    console.log('Running cleanup of expired OTPs (safe to run anytime)...');

    const result = await cleanupExpiredOTPs();

    if (result.success) {
      console.log('✅ Cleanup job completed successfully!');
      console.log(`   Deleted ${result.deletedCount} expired OTP codes`);
    } else {
      console.log('❌ Cleanup job failed');
      console.log(`   Errors: ${result.errors.join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Cleanup job test failed:', error);
  }
}

async function testReminderJobs() {
  console.log('\n⏰ Testing Reminder Jobs...\n');

  try {
    const { sendBookingReminders } = await import('../src/jobs/reminders');

    console.log('Checking for bookings that need reminders...');

    const result = await sendBookingReminders();

    if (result.success || result.errors.length === 0) {
      console.log('✅ Reminder job completed successfully!');
      console.log(`   Sent ${result.remindersSent} reminders`);
      if (result.remindersSent === 0) {
        console.log('   (No bookings found requiring reminders at this time)');
      }
    } else {
      console.log('⚠️  Reminder job completed with errors');
      console.log(`   Sent: ${result.remindersSent}`);
      console.log(`   Errors: ${result.errors.join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Reminder job test failed:', error);
  }
}

async function checkEnvironmentVariables() {
  console.log('\n🔍 Checking Environment Variables...\n');

  const requiredVars = [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_WHATSAPP_NUMBER',
    'RESEND_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const optionalVars = [
    'ADMIN_WHATSAPP',
    'ADMIN_EMAIL',
    'FROM_EMAIL',
    'CRON_SECRET',
    'TEST_PHONE_NUMBER',
    'TEST_EMAIL',
  ];

  console.log('Required variables:');
  let allRequired = true;
  for (const varName of requiredVars) {
    const isSet = !!process.env[varName];
    console.log(`  ${isSet ? '✅' : '❌'} ${varName}`);
    if (!isSet) allRequired = false;
  }

  console.log('\nOptional variables:');
  for (const varName of optionalVars) {
    const isSet = !!process.env[varName];
    console.log(`  ${isSet ? '✅' : '⚠️ '} ${varName}`);
  }

  if (!allRequired) {
    console.log('\n⚠️  Some required variables are missing. Check your .env.local file.');
    return false;
  }

  console.log('\n✅ All required environment variables are set!');
  return true;
}

async function main() {
  console.log('=================================================');
  console.log('  Flavor Entertainers - Integration Tests');
  console.log('=================================================');

  // Check environment variables first
  const envOk = await checkEnvironmentVariables();

  if (!envOk) {
    console.log('\n⚠️  Fix environment variables before running tests.');
    process.exit(1);
  }

  // Run tests based on command line argument
  const testType = process.argv[2];

  switch (testType) {
    case 'twilio':
      await testTwilioIntegration();
      break;
    case 'email':
      await testEmailIntegration();
      break;
    case 'cleanup':
      await testCleanupJobs();
      break;
    case 'reminders':
      await testReminderJobs();
      break;
    case 'all':
    default:
      await testTwilioIntegration();
      await testEmailIntegration();
      await testCleanupJobs();
      await testReminderJobs();
      break;
  }

  console.log('\n=================================================');
  console.log('  Tests Complete!');
  console.log('=================================================\n');
}

main().catch(console.error);
