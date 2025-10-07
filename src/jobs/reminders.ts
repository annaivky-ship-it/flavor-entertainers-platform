/**
 * Reminder Background Jobs
 * Handles automated reminders for bookings and events
 */

import { supabaseAdmin } from '@/lib/supabase-server';
import { sendBookingReminder } from '@/integrations/twilio';
import { sendBookingReminderEmail } from '@/integrations/email';
import type { Booking, Client, Performer } from '@/lib/types/database';

/**
 * Send booking reminders 24 hours before event
 * Sends both WhatsApp and email notifications
 */
export async function sendBookingReminders(): Promise<{
  success: boolean;
  remindersSent: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let remindersSent = 0;

  try {
    console.log('Starting booking reminders job...');

    // Calculate time window: 23-25 hours from now
    // This gives us a 2-hour window to catch all bookings that need 24h reminders
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setHours(windowStart.getHours() + 23);

    const windowEnd = new Date(now);
    windowEnd.setHours(windowEnd.getHours() + 25);

    console.log(`Looking for bookings between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`);

    // Find confirmed bookings happening in 24 hours
    const { data: upcomingBookings, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*, clients(*), performers(*)')
      .in('status', ['confirmed', 'in_progress'])
      .gte('event_date', windowStart.toISOString())
      .lte('event_date', windowEnd.toISOString());

    if (fetchError) {
      throw new Error(`Failed to fetch upcoming bookings: ${fetchError.message}`);
    }

    if (!upcomingBookings || upcomingBookings.length === 0) {
      console.log('No bookings found requiring reminders');
      return { success: true, remindersSent: 0, errors: [] };
    }

    console.log(`Found ${upcomingBookings.length} bookings requiring reminders`);

    // Process each booking
    for (const bookingData of upcomingBookings) {
      try {
        const booking = bookingData as unknown as Booking & {
          clients: Client;
          performers: Performer;
        };

        // Check if reminder already sent (check for reminder notification in last 26 hours)
        const reminderCutoff = new Date();
        reminderCutoff.setHours(reminderCutoff.getHours() - 26);

        const { data: existingReminder } = await supabaseAdmin
          .from('notifications')
          .select('id')
          .eq('booking_id', booking.id)
          .eq('type', 'booking_reminder')
          .gte('created_at', reminderCutoff.toISOString())
          .limit(1);

        if (existingReminder && existingReminder.length > 0) {
          console.log(`Reminder already sent for booking ${booking.booking_reference}`);
          continue;
        }

        // Calculate exact hours until event
        const eventTime = new Date(booking.event_date);
        const hoursUntilEvent = Math.round((eventTime.getTime() - now.getTime()) / (1000 * 60 * 60));

        console.log(`Sending reminder for booking ${booking.booking_reference} (${hoursUntilEvent}h until event)`);

        // Send WhatsApp reminder
        let whatsappSuccess = false;
        try {
          whatsappSuccess = await sendBookingReminder(
            booking,
            booking.clients,
            booking.performers,
            hoursUntilEvent
          );
        } catch (whatsappError) {
          console.error(
            `WhatsApp reminder failed for ${booking.booking_reference}:`,
            whatsappError
          );
          errors.push(
            `WhatsApp failed for ${booking.booking_reference}: ${whatsappError instanceof Error ? whatsappError.message : 'Unknown error'}`
          );
        }

        // Send email reminder
        let emailSuccess = false;
        try {
          emailSuccess = await sendBookingReminderEmail(
            booking,
            booking.clients,
            booking.performers,
            hoursUntilEvent
          );
        } catch (emailError) {
          console.error(
            `Email reminder failed for ${booking.booking_reference}:`,
            emailError
          );
          errors.push(
            `Email failed for ${booking.booking_reference}: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`
          );
        }

        // Create notification records for both client and performer
        const notifications = [
          {
            user_id: booking.client_id,
            booking_id: booking.id,
            type: 'booking_reminder',
            title: 'Event Reminder',
            message: `Your event with ${booking.performers.stage_name} is in ${hoursUntilEvent} hours!`,
            is_read: false,
            created_at: new Date().toISOString(),
          },
          {
            user_id: booking.performer_id,
            booking_id: booking.id,
            type: 'booking_reminder',
            title: 'Upcoming Booking',
            message: `You have a booking with ${booking.clients.first_name} ${booking.clients.last_name} in ${hoursUntilEvent} hours!`,
            is_read: false,
            created_at: new Date().toISOString(),
          },
        ];

        const { error: notificationError } = await supabaseAdmin
          .from('notifications')
          .insert(notifications);

        if (notificationError) {
          console.error(
            `Failed to create notification records for ${booking.booking_reference}:`,
            notificationError
          );
          errors.push(
            `Notification records failed for ${booking.booking_reference}: ${notificationError.message}`
          );
        }

        // Create audit log entry
        await supabaseAdmin.from('audit_logs').insert({
          event_type: 'booking',
          action: 'reminder_sent',
          details: {
            booking_id: booking.id,
            booking_reference: booking.booking_reference,
            hours_until_event: hoursUntilEvent,
            whatsapp_sent: whatsappSuccess,
            email_sent: emailSuccess,
          },
          booking_id: booking.id,
          timestamp: new Date().toISOString(),
        });

        // Count as sent if at least one method succeeded
        if (whatsappSuccess || emailSuccess) {
          remindersSent++;
          console.log(`Reminder sent successfully for ${booking.booking_reference}`);
        } else {
          errors.push(
            `All notification methods failed for ${booking.booking_reference}`
          );
        }
      } catch (bookingError) {
        const errorMessage = bookingError instanceof Error ? bookingError.message : 'Unknown error';
        errors.push(`Error processing booking: ${errorMessage}`);
        console.error('Error processing booking:', bookingError);
      }
    }

    console.log(`Booking reminders job completed. Sent: ${remindersSent}, Errors: ${errors.length}`);

    return {
      success: errors.length === 0,
      remindersSent,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Fatal error in sendBookingReminders:', errorMessage);
    return {
      success: false,
      remindersSent,
      errors: [...errors, errorMessage],
    };
  }
}

/**
 * Send payment reminder for bookings with pending balance
 * Reminds clients about outstanding balance 3 days before event
 */
export async function sendPaymentReminders(): Promise<{
  success: boolean;
  remindersSent: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let remindersSent = 0;

  try {
    console.log('Starting payment reminders job...');

    // Calculate time window: 2-4 days from now
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() + 2);

    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + 4);

    // Find confirmed bookings with pending balance
    const { data: bookingsWithBalance, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*, clients(*), performers(*)')
      .in('status', ['confirmed', 'in_progress'])
      .eq('payment_status', 'deposit_paid')
      .gte('event_date', windowStart.toISOString())
      .lte('event_date', windowEnd.toISOString());

    if (fetchError) {
      throw new Error(`Failed to fetch bookings with balance: ${fetchError.message}`);
    }

    if (!bookingsWithBalance || bookingsWithBalance.length === 0) {
      console.log('No bookings found requiring payment reminders');
      return { success: true, remindersSent: 0, errors: [] };
    }

    console.log(`Found ${bookingsWithBalance.length} bookings requiring payment reminders`);

    // Process each booking
    for (const bookingData of bookingsWithBalance) {
      try {
        const booking = bookingData as unknown as Booking & {
          clients: Client;
          performers: Performer;
        };

        // Check if payment reminder already sent recently
        const reminderCutoff = new Date();
        reminderCutoff.setDate(reminderCutoff.getDate() - 5);

        const { data: existingReminder } = await supabaseAdmin
          .from('notifications')
          .select('id')
          .eq('booking_id', booking.id)
          .eq('type', 'payment_reminder')
          .gte('created_at', reminderCutoff.toISOString())
          .limit(1);

        if (existingReminder && existingReminder.length > 0) {
          console.log(`Payment reminder already sent for booking ${booking.booking_reference}`);
          continue;
        }

        const balance = booking.total_amount - booking.deposit_amount;
        const eventDate = new Date(booking.event_date);
        const daysUntilEvent = Math.round((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Send payment reminder notification
        const { error: notificationError } = await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: booking.client_id,
            booking_id: booking.id,
            type: 'payment_reminder',
            title: 'Payment Reminder',
            message: `Reminder: Balance of $${balance.toFixed(2)} is due for your upcoming event in ${daysUntilEvent} days`,
            is_read: false,
            created_at: new Date().toISOString(),
          });

        if (notificationError) {
          console.error(
            `Failed to create payment reminder for ${booking.booking_reference}:`,
            notificationError
          );
          errors.push(
            `Payment reminder failed for ${booking.booking_reference}: ${notificationError.message}`
          );
          continue;
        }

        remindersSent++;
        console.log(`Payment reminder sent for ${booking.booking_reference}`);
      } catch (bookingError) {
        const errorMessage = bookingError instanceof Error ? bookingError.message : 'Unknown error';
        errors.push(`Error processing booking: ${errorMessage}`);
      }
    }

    console.log(`Payment reminders job completed. Sent: ${remindersSent}, Errors: ${errors.length}`);

    return {
      success: errors.length === 0,
      remindersSent,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Fatal error in sendPaymentReminders:', errorMessage);
    return {
      success: false,
      remindersSent,
      errors: [...errors, errorMessage],
    };
  }
}

/**
 * Run all reminder jobs
 * Convenience function to run all reminder tasks
 */
export async function runAllReminderJobs(): Promise<{
  success: boolean;
  results: {
    bookingReminders: Awaited<ReturnType<typeof sendBookingReminders>>;
    paymentReminders: Awaited<ReturnType<typeof sendPaymentReminders>>;
  };
}> {
  console.log('Running all reminder jobs...');

  const results = {
    bookingReminders: await sendBookingReminders(),
    paymentReminders: await sendPaymentReminders(),
  };

  const success = Object.values(results).every(r => r.success);

  console.log('All reminder jobs completed');
  console.log('Summary:', {
    bookingRemindersSent: results.bookingReminders.remindersSent,
    paymentRemindersSent: results.paymentReminders.remindersSent,
    totalErrors: Object.values(results).reduce((sum, r) => sum + r.errors.length, 0),
  });

  return { success, results };
}

/**
 * Export all reminder functions
 */
export default {
  sendBookingReminders,
  sendPaymentReminders,
  runAllReminderJobs,
};
