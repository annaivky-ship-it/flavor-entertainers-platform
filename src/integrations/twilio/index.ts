/**
 * Twilio WhatsApp Integration
 * Handles WhatsApp messaging via Twilio API
 */

import twilio from 'twilio';
import { formatPhoneForWhatsApp, formatCurrency, formatDateTime } from '@/lib/utils';
import type { Booking, Performer, Client } from '@/lib/types/database';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const adminWhatsApp = process.env.ADMIN_WHATSAPP;

let twilioClient: twilio.Twilio | null = null;

/**
 * Get or initialize Twilio client
 */
function getTwilioClient(): twilio.Twilio {
  if (!twilioClient) {
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
    }
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

/**
 * Send WhatsApp message via Twilio
 */
export async function sendWhatsApp(
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!twilioWhatsAppNumber) {
      throw new Error('TWILIO_WHATSAPP_NUMBER not configured');
    }

    const client = getTwilioClient();
    const formattedTo = formatPhoneForWhatsApp(to);
    const formattedFrom = formatPhoneForWhatsApp(twilioWhatsAppNumber);

    const result = await client.messages.create({
      from: formattedFrom,
      to: formattedTo,
      body: message,
    });

    console.log(`WhatsApp message sent to ${to}: ${result.sid}`);

    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send WhatsApp message to admin
 */
export async function sendAdminWhatsApp(message: string): Promise<boolean> {
  if (!adminWhatsApp) {
    console.warn('ADMIN_WHATSAPP not configured, skipping admin notification');
    return false;
  }

  const result = await sendWhatsApp(adminWhatsApp, message);
  return result.success;
}

/**
 * Notify about new booking creation
 */
export async function notifyBookingCreated(
  booking: Booking,
  client: Client,
  performer: Performer
): Promise<boolean> {
  const clientMessage = `
🎉 Booking Created Successfully!

Booking Reference: ${booking.booking_reference}
Performer: ${performer.stage_name}
Event Date: ${formatDateTime(booking.event_date)}
Duration: ${booking.duration_hours} hours
Total Amount: ${formatCurrency(booking.total_amount)}
Deposit Required: ${formatCurrency(booking.deposit_amount)}

Please upload your deposit receipt to confirm your booking.

Thank you for choosing Flavor Entertainers!
`.trim();

  const performerMessage = `
📅 New Booking Request!

Booking Reference: ${booking.booking_reference}
Client: ${client.first_name} ${client.last_name}
Event Date: ${formatDateTime(booking.event_date)}
Duration: ${booking.duration_hours} hours
Amount: ${formatCurrency(booking.total_amount)}
Venue: ${booking.venue_address}

Status: Pending deposit verification

We'll notify you once the client uploads their deposit.
`.trim();

  const adminMessage = `
🔔 New Booking Created

Reference: ${booking.booking_reference}
Client: ${client.first_name} ${client.last_name}
Performer: ${performer.stage_name}
Date: ${formatDateTime(booking.event_date)}
Amount: ${formatCurrency(booking.total_amount)}

Action Required: Monitor deposit upload
`.trim();

  const results = await Promise.all([
    sendWhatsApp(client.phone, clientMessage),
    sendWhatsApp(performer.phone, performerMessage),
    sendAdminWhatsApp(adminMessage),
  ]);

  return results.every(r => r.success);
}

/**
 * Notify about booking approval (admin approved the booking)
 */
export async function notifyBookingApproved(
  booking: Booking,
  client: Client,
  performer: Performer
): Promise<boolean> {
  const clientMessage = `
✅ Booking Approved!

Your booking ${booking.booking_reference} has been approved by our team.

Event Date: ${formatDateTime(booking.event_date)}
Performer: ${performer.stage_name}
Status: Confirmed

Your deposit receipt is under review. We'll notify you once verified.

Questions? Reply to this message or contact support.
`.trim();

  const result = await sendWhatsApp(client.phone, clientMessage);
  return result.success;
}

/**
 * Notify about deposit receipt upload
 */
export async function notifyDepositUploaded(
  booking: Booking,
  client: Client,
  performer: Performer
): Promise<boolean> {
  const performerMessage = `
💰 Deposit Uploaded

Booking: ${booking.booking_reference}
Client: ${client.first_name} ${client.last_name}
Event Date: ${formatDateTime(booking.event_date)}

The client has uploaded their deposit receipt.
Our team is verifying the payment.

We'll notify you once it's confirmed.
`.trim();

  const adminMessage = `
🧾 Deposit Receipt Uploaded

Booking: ${booking.booking_reference}
Client: ${client.first_name} ${client.last_name}
Performer: ${performer.stage_name}
Amount: ${formatCurrency(booking.deposit_amount)}

Action Required: Verify deposit receipt in admin dashboard
`.trim();

  const results = await Promise.all([
    sendWhatsApp(performer.phone, performerMessage),
    sendAdminWhatsApp(adminMessage),
  ]);

  return results.every(r => r.success);
}

/**
 * Notify about deposit verification
 */
export async function notifyDepositVerified(
  booking: Booking,
  client: Client,
  performer: Performer
): Promise<boolean> {
  const clientMessage = `
✅ Deposit Verified!

Your deposit for booking ${booking.booking_reference} has been verified.

Event Details:
Date: ${formatDateTime(booking.event_date)}
Performer: ${performer.stage_name}
Venue: ${booking.venue_address}

Status: Confirmed - Awaiting performer acceptance

We'll notify you once the performer accepts.
`.trim();

  const performerMessage = `
✅ Deposit Verified - Action Required!

Booking: ${booking.booking_reference}
Client: ${client.first_name} ${client.last_name}
Event Date: ${formatDateTime(booking.event_date)}
Venue: ${booking.venue_address}
Payment: ${formatCurrency(booking.deposit_amount)} (Verified)

Please log in to accept or decline this booking.

Note: Remaining balance (${formatCurrency(booking.total_amount - booking.deposit_amount)}) due on event day.
`.trim();

  const results = await Promise.all([
    sendWhatsApp(client.phone, clientMessage),
    sendWhatsApp(performer.phone, performerMessage),
  ]);

  return results.every(r => r.success);
}

/**
 * Notify about performer accepting the booking
 */
export async function notifyBookingAccepted(
  booking: Booking,
  client: Client,
  performer: Performer
): Promise<boolean> {
  const clientMessage = `
🎊 Booking Confirmed!

Great news! ${performer.stage_name} has accepted your booking.

Booking Reference: ${booking.booking_reference}
Event Date: ${formatDateTime(booking.event_date)}
Duration: ${booking.duration_hours} hours
Venue: ${booking.venue_address}

Remaining Balance: ${formatCurrency(booking.total_amount - booking.deposit_amount)}
(Due on event day)

Looking forward to making your event amazing!

Questions? Contact ${performer.stage_name} at ${performer.phone}
`.trim();

  const performerMessage = `
✅ Booking Accepted

You've successfully accepted booking ${booking.booking_reference}.

Client: ${client.first_name} ${client.last_name}
Contact: ${client.phone}
Event Date: ${formatDateTime(booking.event_date)}
Venue: ${booking.venue_address}
Guests: ${booking.guest_count}

${booking.special_requirements ? `Special Requirements:\n${booking.special_requirements}` : ''}

Reminder: Collect balance of ${formatCurrency(booking.total_amount - booking.deposit_amount)} on event day.

Good luck!
`.trim();

  const results = await Promise.all([
    sendWhatsApp(client.phone, clientMessage),
    sendWhatsApp(performer.phone, performerMessage),
  ]);

  return results.every(r => r.success);
}

/**
 * Parse WhatsApp command from incoming message
 * Example commands:
 * - STATUS <booking_ref>
 * - CANCEL <booking_ref>
 * - HELP
 */
export function parseWhatsAppCommand(message: string): {
  command: string;
  args: string[];
  bookingRef?: string;
} {
  const trimmed = message.trim().toUpperCase();
  const parts = trimmed.split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);

  const result: {
    command: string;
    args: string[];
    bookingRef?: string;
  } = {
    command,
    args,
  };

  // Extract booking reference if present
  if (command === 'STATUS' || command === 'CANCEL') {
    result.bookingRef = args[0];
  }

  return result;
}

/**
 * Send booking reminder
 */
export async function sendBookingReminder(
  booking: Booking,
  client: Client,
  performer: Performer,
  hoursUntilEvent: number
): Promise<boolean> {
  const clientMessage = `
⏰ Event Reminder

Your event is in ${hoursUntilEvent} hours!

Booking: ${booking.booking_reference}
Performer: ${performer.stage_name}
Date & Time: ${formatDateTime(booking.event_date)}
Venue: ${booking.venue_address}
Duration: ${booking.duration_hours} hours

Remaining Balance: ${formatCurrency(booking.total_amount - booking.deposit_amount)}
(Please have this ready in ${booking.payment_method || 'cash'})

Performer Contact: ${performer.phone}

Have a great event!
`.trim();

  const performerMessage = `
⏰ Upcoming Booking Reminder

Event in ${hoursUntilEvent} hours!

Booking: ${booking.booking_reference}
Client: ${client.first_name} ${client.last_name}
Contact: ${client.phone}
Date & Time: ${formatDateTime(booking.event_date)}
Venue: ${booking.venue_address}
Duration: ${booking.duration_hours} hours
Guests: ${booking.guest_count}

Balance to Collect: ${formatCurrency(booking.total_amount - booking.deposit_amount)}

${booking.special_requirements ? `Special Requirements:\n${booking.special_requirements}\n\n` : ''}Good luck with the event!
`.trim();

  const results = await Promise.all([
    sendWhatsApp(client.phone, clientMessage),
    sendWhatsApp(performer.phone, performerMessage),
  ]);

  return results.every(r => r.success);
}

/**
 * Send booking cancellation notification
 */
export async function notifyBookingCancelled(
  booking: Booking,
  client: Client,
  performer: Performer,
  reason: string
): Promise<boolean> {
  const clientMessage = `
❌ Booking Cancelled

Your booking ${booking.booking_reference} has been cancelled.

Reason: ${reason}

Event Date: ${formatDateTime(booking.event_date)}
Performer: ${performer.stage_name}

If you have any questions, please contact support.
`.trim();

  const performerMessage = `
❌ Booking Cancelled

Booking ${booking.booking_reference} has been cancelled.

Client: ${client.first_name} ${client.last_name}
Event Date: ${formatDateTime(booking.event_date)}
Reason: ${reason}

Your calendar slot is now available.
`.trim();

  const results = await Promise.all([
    sendWhatsApp(client.phone, clientMessage),
    sendWhatsApp(performer.phone, performerMessage),
  ]);

  return results.every(r => r.success);
}

/**
 * Export all functions
 */
export default {
  sendWhatsApp,
  sendAdminWhatsApp,
  notifyBookingCreated,
  notifyBookingApproved,
  notifyDepositUploaded,
  notifyDepositVerified,
  notifyBookingAccepted,
  parseWhatsAppCommand,
  sendBookingReminder,
  notifyBookingCancelled,
};
