/**
 * Cron job endpoint for cleanup tasks
 * This endpoint should be called by a cron service (e.g., Vercel Cron, GitHub Actions)
 *
 * Recommended schedule: Daily at 2 AM
 */

import { NextResponse } from 'next/server';
import { runAllCleanupJobs } from '@/jobs/cleanup';

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

    console.log('Starting cleanup cron job...');

    // Run all cleanup jobs
    const result = await runAllCleanupJobs();

    // Log results
    console.log('Cleanup cron job completed:', {
      success: result.success,
      staleBookingsCancelled: result.results.staleBookings.cancelledCount,
      notificationsDeleted: result.results.oldNotifications.deletedCount,
      otpsDeleted: result.results.expiredOTPs.deletedCount,
      auditLogsDeleted: result.results.oldAuditLogs.deletedCount,
    });

    // Return summary
    return NextResponse.json({
      success: result.success,
      timestamp: new Date().toISOString(),
      summary: {
        staleBookings: {
          cancelled: result.results.staleBookings.cancelledCount,
          errors: result.results.staleBookings.errors,
        },
        notifications: {
          deleted: result.results.oldNotifications.deletedCount,
          errors: result.results.oldNotifications.errors,
        },
        otps: {
          deleted: result.results.expiredOTPs.deletedCount,
          errors: result.results.expiredOTPs.errors,
        },
        auditLogs: {
          deleted: result.results.oldAuditLogs.deletedCount,
          errors: result.results.oldAuditLogs.errors,
        },
      },
    });
  } catch (error) {
    console.error('Error in cleanup cron job:', error);
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
