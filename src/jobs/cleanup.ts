/**
 * Cleanup Background Jobs
 * Handles automated cleanup of stale data
 */

import { supabaseAdmin } from '@/lib/supabase-server';
import { notifyBookingCancelled } from '@/integrations/twilio';
import type { Booking, Client, Performer } from '@/lib/types/database';

/**
 * Clean up stale bookings that haven't received deposit within 24 hours
 * Automatically cancels bookings where status is 'pending' and deposit hasn't been uploaded
 */
export async function cleanupStaleBookings(): Promise<{
  success: boolean;
  cancelledCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let cancelledCount = 0;

  try {
    console.log('Starting stale bookings cleanup...');

    // Calculate cutoff time (24 hours ago)
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24);

    // Find pending bookings older than 24 hours without deposit
    const { data: staleBookings, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*, clients(*), performers(*)')
      .eq('status', 'pending')
      .eq('payment_status', 'pending')
      .lt('created_at', cutoffTime.toISOString());

    if (fetchError) {
      throw new Error(`Failed to fetch stale bookings: ${fetchError.message}`);
    }

    if (!staleBookings || staleBookings.length === 0) {
      console.log('No stale bookings found');
      return { success: true, cancelledCount: 0, errors: [] };
    }

    console.log(`Found ${staleBookings.length} stale bookings to cancel`);

    // Process each stale booking
    for (const bookingData of staleBookings) {
      try {
        const booking = bookingData as unknown as Booking & {
          clients: Client;
          performers: Performer;
        };

        // Update booking status to cancelled
        const { error: updateError } = await supabaseAdmin
          .from('bookings')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', booking.id);

        if (updateError) {
          errors.push(`Failed to cancel booking ${booking.booking_reference}: ${updateError.message}`);
          continue;
        }

        // Create audit log entry
        await supabaseAdmin.from('audit_logs').insert({
          event_type: 'booking',
          action: 'auto_cancelled_stale',
          details: {
            booking_id: booking.id,
            booking_reference: booking.booking_reference,
            reason: 'No deposit uploaded within 24 hours',
            created_at: booking.created_at,
          },
          booking_id: booking.id,
          timestamp: new Date().toISOString(),
        });

        // Send cancellation notifications
        try {
          await notifyBookingCancelled(
            booking,
            booking.clients,
            booking.performers,
            'No deposit uploaded within 24 hours. Please create a new booking if you still wish to proceed.'
          );
        } catch (notificationError) {
          console.error(
            `Failed to send cancellation notification for ${booking.booking_reference}:`,
            notificationError
          );
          // Don't fail the entire operation if notification fails
        }

        cancelledCount++;
        console.log(`Cancelled stale booking: ${booking.booking_reference}`);
      } catch (bookingError) {
        const errorMessage = bookingError instanceof Error ? bookingError.message : 'Unknown error';
        errors.push(`Error processing booking: ${errorMessage}`);
      }
    }

    console.log(`Stale bookings cleanup completed. Cancelled: ${cancelledCount}, Errors: ${errors.length}`);

    return {
      success: errors.length === 0,
      cancelledCount,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Fatal error in cleanupStaleBookings:', errorMessage);
    return {
      success: false,
      cancelledCount,
      errors: [...errors, errorMessage],
    };
  }
}

/**
 * Clean up old read notifications (older than 30 days)
 * Helps keep the notifications table manageable and performant
 */
export async function cleanupOldNotifications(): Promise<{
  success: boolean;
  deletedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let deletedCount = 0;

  try {
    console.log('Starting old notifications cleanup...');

    // Calculate cutoff time (30 days ago)
    const cutoffTime = new Date();
    cutoffTime.setDate(cutoffTime.getDate() - 30);

    // Delete read notifications older than 30 days
    const { data: deletedNotifications, error: deleteError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('is_read', true)
      .lt('created_at', cutoffTime.toISOString())
      .select('id');

    if (deleteError) {
      throw new Error(`Failed to delete old notifications: ${deleteError.message}`);
    }

    deletedCount = deletedNotifications?.length || 0;

    console.log(`Deleted ${deletedCount} old read notifications`);

    // Create audit log entry for cleanup operation
    if (deletedCount > 0) {
      await supabaseAdmin.from('audit_logs').insert({
        event_type: 'system',
        action: 'cleanup_old_notifications',
        details: {
          deleted_count: deletedCount,
          cutoff_date: cutoffTime.toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    }

    return {
      success: true,
      deletedCount,
      errors: [],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Fatal error in cleanupOldNotifications:', errorMessage);
    return {
      success: false,
      deletedCount,
      errors: [errorMessage],
    };
  }
}

/**
 * Clean up expired OTP codes
 * Removes OTP codes that are older than their expiry time
 */
export async function cleanupExpiredOTPs(): Promise<{
  success: boolean;
  deletedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let deletedCount = 0;

  try {
    console.log('Starting expired OTPs cleanup...');

    const now = new Date();

    // Delete expired OTP codes
    const { data: deletedOTPs, error: deleteError } = await supabaseAdmin
      .from('otp_codes')
      .delete()
      .lt('expires_at', now.toISOString())
      .select('id');

    if (deleteError) {
      throw new Error(`Failed to delete expired OTPs: ${deleteError.message}`);
    }

    deletedCount = deletedOTPs?.length || 0;

    console.log(`Deleted ${deletedCount} expired OTP codes`);

    return {
      success: true,
      deletedCount,
      errors: [],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Fatal error in cleanupExpiredOTPs:', errorMessage);
    return {
      success: false,
      deletedCount,
      errors: [errorMessage],
    };
  }
}

/**
 * Clean up old audit logs (older than 90 days)
 * Keeps audit logs manageable while retaining recent history
 */
export async function cleanupOldAuditLogs(): Promise<{
  success: boolean;
  deletedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let deletedCount = 0;

  try {
    console.log('Starting old audit logs cleanup...');

    // Calculate cutoff time (90 days ago)
    const cutoffTime = new Date();
    cutoffTime.setDate(cutoffTime.getDate() - 90);

    // Delete audit logs older than 90 days (except critical events)
    const { data: deletedLogs, error: deleteError } = await supabaseAdmin
      .from('audit_logs')
      .delete()
      .lt('timestamp', cutoffTime.toISOString())
      .not('event_type', 'in', '(security,fraud,dispute)') // Keep critical events indefinitely
      .select('id');

    if (deleteError) {
      throw new Error(`Failed to delete old audit logs: ${deleteError.message}`);
    }

    deletedCount = deletedLogs?.length || 0;

    console.log(`Deleted ${deletedCount} old audit logs`);

    return {
      success: true,
      deletedCount,
      errors: [],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Fatal error in cleanupOldAuditLogs:', errorMessage);
    return {
      success: false,
      deletedCount,
      errors: [errorMessage],
    };
  }
}

/**
 * Run all cleanup jobs
 * Convenience function to run all cleanup tasks
 */
export async function runAllCleanupJobs(): Promise<{
  success: boolean;
  results: {
    staleBookings: Awaited<ReturnType<typeof cleanupStaleBookings>>;
    oldNotifications: Awaited<ReturnType<typeof cleanupOldNotifications>>;
    expiredOTPs: Awaited<ReturnType<typeof cleanupExpiredOTPs>>;
    oldAuditLogs: Awaited<ReturnType<typeof cleanupOldAuditLogs>>;
  };
}> {
  console.log('Running all cleanup jobs...');

  const results = {
    staleBookings: await cleanupStaleBookings(),
    oldNotifications: await cleanupOldNotifications(),
    expiredOTPs: await cleanupExpiredOTPs(),
    oldAuditLogs: await cleanupOldAuditLogs(),
  };

  const success = Object.values(results).every(r => r.success);

  console.log('All cleanup jobs completed');
  console.log('Summary:', {
    staleBookingsCancelled: results.staleBookings.cancelledCount,
    notificationsDeleted: results.oldNotifications.deletedCount,
    otpsDeleted: results.expiredOTPs.deletedCount,
    auditLogsDeleted: results.oldAuditLogs.deletedCount,
    totalErrors: Object.values(results).reduce((sum, r) => sum + r.errors.length, 0),
  });

  return { success, results };
}

/**
 * Export all cleanup functions
 */
export default {
  cleanupStaleBookings,
  cleanupOldNotifications,
  cleanupExpiredOTPs,
  cleanupOldAuditLogs,
  runAllCleanupJobs,
};
