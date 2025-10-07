/**
 * Email Integration using Resend
 * Handles transactional emails for the platform
 */

import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils';
import type { Booking, Performer, Client, VettingApplication } from '@/lib/types/database';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@flavorentertainers.com.au';
const FROM_EMAIL = process.env.FROM_EMAIL || 'bookings@flavorentertainers.com.au';

/**
 * Send email using Resend API
 */
export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        html,
        reply_to: replyTo,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send email');
    }

    const data = await response.json();
    console.log(`Email sent to ${to}: ${data.id}`);

    return {
      success: true,
      messageId: data.id,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get booking confirmation email HTML
 */
export function getBookingConfirmationEmail(
  booking: Booking,
  client: Client,
  performer: Performer
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .booking-details {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #667eea;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-label {
      font-weight: 600;
      color: #6b7280;
    }
    .detail-value {
      color: #111827;
    }
    .highlight {
      background: #fef3c7;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #f59e0b;
    }
    .cta-button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Booking Confirmed!</h1>
  </div>

  <div class="content">
    <p>Hi ${client.first_name},</p>

    <p>Your booking with Flavor Entertainers has been confirmed! We're excited to make your event unforgettable.</p>

    <div class="booking-details">
      <h2 style="margin-top: 0;">Booking Details</h2>

      <div class="detail-row">
        <span class="detail-label">Booking Reference:</span>
        <span class="detail-value"><strong>${booking.booking_reference}</strong></span>
      </div>

      <div class="detail-row">
        <span class="detail-label">Performer:</span>
        <span class="detail-value">${performer.stage_name}</span>
      </div>

      <div class="detail-row">
        <span class="detail-label">Event Date & Time:</span>
        <span class="detail-value">${formatDateTime(booking.event_date)}</span>
      </div>

      <div class="detail-row">
        <span class="detail-label">Duration:</span>
        <span class="detail-value">${booking.duration_hours} hours</span>
      </div>

      <div class="detail-row">
        <span class="detail-label">Venue:</span>
        <span class="detail-value">${booking.venue_address}</span>
      </div>

      <div class="detail-row">
        <span class="detail-label">Number of Guests:</span>
        <span class="detail-value">${booking.guest_count}</span>
      </div>

      <div class="detail-row" style="border-bottom: none;">
        <span class="detail-label">Event Type:</span>
        <span class="detail-value">${booking.event_type}</span>
      </div>
    </div>

    <div class="highlight">
      <h3 style="margin-top: 0;">💰 Payment Summary</h3>
      <div class="detail-row">
        <span class="detail-label">Total Amount:</span>
        <span class="detail-value"><strong>${formatCurrency(booking.total_amount)}</strong></span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Deposit Paid:</span>
        <span class="detail-value">${formatCurrency(booking.deposit_amount)}</span>
      </div>
      <div class="detail-row" style="border-bottom: none;">
        <span class="detail-label">Balance Due (on event day):</span>
        <span class="detail-value"><strong>${formatCurrency(booking.total_amount - booking.deposit_amount)}</strong></span>
      </div>
    </div>

    ${booking.special_requirements ? `
    <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">📝 Special Requirements</h3>
      <p>${booking.special_requirements}</p>
    </div>
    ` : ''}

    <h3>What's Next?</h3>
    <ul>
      <li>You'll receive a reminder 24 hours before your event</li>
      <li>Please have the remaining balance ready in ${booking.payment_method || 'cash'}</li>
      <li>If you need to contact ${performer.stage_name}, their phone is: ${performer.phone}</li>
    </ul>

    <p><strong>Need to make changes?</strong> Contact us as soon as possible at ${ADMIN_EMAIL}</p>

    <div class="footer">
      <p>Flavor Entertainers Australia</p>
      <p>Making your events unforgettable since 2024</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Get OTP email HTML
 */
export function getOTPEmail(otp: string, expiryMinutes: number = 10): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .otp-box {
      background: white;
      border: 2px dashed #667eea;
      border-radius: 8px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .otp-code {
      font-size: 36px;
      font-weight: bold;
      letter-spacing: 8px;
      color: #667eea;
      font-family: 'Courier New', monospace;
    }
    .warning {
      background: #fee2e2;
      color: #991b1b;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #dc2626;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔐 Your Verification Code</h1>
  </div>

  <div class="content">
    <p>You requested a verification code to access your Flavor Entertainers account.</p>

    <div class="otp-box">
      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Your verification code is:</p>
      <div class="otp-code">${otp}</div>
      <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">Valid for ${expiryMinutes} minutes</p>
    </div>

    <p style="text-align: center;">Enter this code to complete your verification.</p>

    <div class="warning">
      <strong>⚠️ Security Notice</strong><br>
      Never share this code with anyone. Flavor Entertainers staff will never ask for your verification code.
    </div>

    <p style="font-size: 14px; color: #6b7280;">
      If you didn't request this code, please ignore this email or contact support if you have concerns about your account security.
    </p>

    <div class="footer">
      <p>Flavor Entertainers Australia</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Get vetting approval email HTML
 */
export function getVettingApprovalEmail(
  application: VettingApplication,
  approved: boolean,
  notes?: string
): string {
  if (approved) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .success-box {
      background: #d1fae5;
      border-left: 4px solid #10b981;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .next-steps {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .cta-button {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 15px 40px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Congratulations!</h1>
  </div>

  <div class="content">
    <p>Hi ${application.full_name},</p>

    <div class="success-box">
      <h2 style="margin-top: 0; color: #065f46;">Your Application Has Been Approved!</h2>
      <p>Welcome to the Flavor Entertainers family! We're thrilled to have you join our platform.</p>
    </div>

    <p>Your application to become a performer on Flavor Entertainers has been reviewed and approved.</p>

    ${notes ? `
    <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <strong>Message from our team:</strong><br>
      ${notes}
    </div>
    ` : ''}

    <div class="next-steps">
      <h3 style="margin-top: 0;">📋 Next Steps:</h3>
      <ol>
        <li><strong>Complete Your Profile:</strong> Add photos, update your bio, and showcase your talents</li>
        <li><strong>Set Your Availability:</strong> Update your calendar and hourly rates</li>
        <li><strong>Set Up Payment:</strong> Configure your PayID for receiving payments</li>
        <li><strong>Start Accepting Bookings:</strong> You're ready to receive booking requests!</li>
      </ol>
    </div>

    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://flavorentertainers.com.au'}/performers/dashboard" class="cta-button">
        Go to Your Dashboard
      </a>
    </div>

    <p><strong>Need help getting started?</strong> Check out our performer guide or contact us at ${ADMIN_EMAIL}</p>

    <div class="footer">
      <p>Flavor Entertainers Australia</p>
      <p>Making your events unforgettable since 2024</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  } else {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .info-box {
      background: #fee2e2;
      border-left: 4px solid #ef4444;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Application Update</h1>
  </div>

  <div class="content">
    <p>Hi ${application.full_name},</p>

    <p>Thank you for your interest in joining Flavor Entertainers as a performer.</p>

    <div class="info-box">
      <p>After careful review, we're unable to approve your application at this time.</p>
    </div>

    ${notes ? `
    <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <strong>Feedback:</strong><br>
      ${notes}
    </div>
    ` : ''}

    <p>This decision doesn't diminish your talent or value as an entertainer. We have specific criteria that must be met for our platform, and we encourage you to:</p>

    <ul>
      <li>Review the feedback provided (if any)</li>
      <li>Consider reapplying in the future after addressing any concerns</li>
      <li>Contact us if you have questions about this decision</li>
    </ul>

    <p>If you believe this decision was made in error or would like to discuss it further, please reach out to us at ${ADMIN_EMAIL}</p>

    <p>We wish you all the best in your entertainment career.</p>

    <div class="footer">
      <p>Flavor Entertainers Australia</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(
  booking: Booking,
  client: Client,
  performer: Performer
): Promise<boolean> {
  const html = getBookingConfirmationEmail(booking, client, performer);
  const result = await sendEmail({
    to: client.email,
    subject: `Booking Confirmed - ${booking.booking_reference}`,
    html,
    replyTo: ADMIN_EMAIL,
  });

  return result.success;
}

/**
 * Send OTP email
 */
export async function sendOTPEmail(
  email: string,
  otp: string,
  expiryMinutes: number = 10
): Promise<boolean> {
  const html = getOTPEmail(otp, expiryMinutes);
  const result = await sendEmail({
    to: email,
    subject: 'Your Verification Code - Flavor Entertainers',
    html,
  });

  return result.success;
}

/**
 * Send vetting approval/rejection email
 */
export async function sendVettingApprovalEmail(
  application: VettingApplication,
  approved: boolean,
  notes?: string
): Promise<boolean> {
  const html = getVettingApprovalEmail(application, approved, notes);
  const subject = approved
    ? '🎉 Your Performer Application Has Been Approved!'
    : 'Application Update - Flavor Entertainers';

  const result = await sendEmail({
    to: application.email,
    subject,
    html,
    replyTo: ADMIN_EMAIL,
  });

  return result.success;
}

/**
 * Send booking reminder email
 */
export async function sendBookingReminderEmail(
  booking: Booking,
  client: Client,
  performer: Performer,
  hoursUntilEvent: number
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .reminder-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>⏰ Event Reminder</h1>
  </div>

  <div class="content">
    <p>Hi ${client.first_name},</p>

    <div class="reminder-box">
      <h2 style="margin-top: 0;">Your event is in ${hoursUntilEvent} hours!</h2>
    </div>

    <p><strong>Booking Details:</strong></p>
    <div style="background: white; padding: 20px; border-radius: 8px;">
      <div class="detail-row">
        <span>Booking Reference:</span>
        <strong>${booking.booking_reference}</strong>
      </div>
      <div class="detail-row">
        <span>Performer:</span>
        <span>${performer.stage_name}</span>
      </div>
      <div class="detail-row">
        <span>Date & Time:</span>
        <span>${formatDateTime(booking.event_date)}</span>
      </div>
      <div class="detail-row">
        <span>Venue:</span>
        <span>${booking.venue_address}</span>
      </div>
      <div class="detail-row" style="border-bottom: none;">
        <span>Duration:</span>
        <span>${booking.duration_hours} hours</span>
      </div>
    </div>

    <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <strong>💰 Reminder:</strong> Remaining balance of <strong>${formatCurrency(booking.total_amount - booking.deposit_amount)}</strong> is due at the event.
      <br>Please have this ready in ${booking.payment_method || 'cash'}.
    </div>

    <p><strong>Performer Contact:</strong> ${performer.phone}</p>

    <p>Have a fantastic event! 🎉</p>

    <div class="footer">
      <p>Flavor Entertainers Australia</p>
      <p>This is an automated reminder. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const result = await sendEmail({
    to: client.email,
    subject: `⏰ Event Reminder - ${booking.booking_reference} in ${hoursUntilEvent} hours`,
    html,
  });

  return result.success;
}

/**
 * Export all functions
 */
export default {
  sendEmail,
  getBookingConfirmationEmail,
  getOTPEmail,
  getVettingApprovalEmail,
  sendBookingConfirmationEmail,
  sendOTPEmail,
  sendVettingApprovalEmail,
  sendBookingReminderEmail,
};
