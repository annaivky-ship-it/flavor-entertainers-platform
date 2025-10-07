/**
 * Cron job endpoint for sending reminders
 * This endpoint should be called by a cron service (e.g., Vercel Cron, GitHub Actions)
 *
 * Recommended schedule: Every hour
 */

import { NextResponse } from 'next/server';
import { runAllReminderJobs } from '@/jobs/reminders';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron job attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting reminders cron job...');

    // Run all reminder jobs
    const result = await runAllReminderJobs();

    // Log results
    console.log('Reminders cron job completed:', {
      success: result.success,
      bookingRemindersSent: result.results.bookingReminders.remindersSent,
      paymentRemindersSent: result.results.paymentReminders.remindersSent,
    });

    // Return summary
    return NextResponse.json({
      success: result.success,
      timestamp: new Date().toISOString(),
      summary: {
        bookingReminders: {
          sent: result.results.bookingReminders.remindersSent,
          errors: result.results.bookingReminders.errors,
        },
        paymentReminders: {
          sent: result.results.paymentReminders.remindersSent,
          errors: result.results.paymentReminders.errors,
        },
      },
    });
  } catch (error) {
    console.error('Error in reminders cron job:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
