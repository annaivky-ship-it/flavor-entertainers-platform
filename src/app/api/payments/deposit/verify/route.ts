/**
 * POST /api/payments/deposit/verify
 * Admin verify deposit
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withErrorHandler, successResponse, errorResponse, requireAuth, validateRequest } from '@/lib/api-utils';
import { prisma, createAuditLog, createNotification } from '@/lib/db';

const verifySchema = z.object({
  paymentId: z.string().uuid(),
  verified: z.boolean(),
  notes: z.string().optional(),
});

async function handler(request: NextRequest) {
  const authResult = await requireAuth(request, ['ADMIN']);
  if (authResult instanceof Response) {
    return authResult;
  }

  const { userId } = authResult;

  const validation = await validateRequest(request, verifySchema);
  if ('error' in validation) {
    return validation.error;
  }

  const { paymentId, verified, notes } = validation.data;

  // Get payment
  const payment = await prisma.paymentTransaction.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          client: true,
          performer: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!payment) {
    return errorResponse('Payment not found', 404);
  }

  // Update payment
  const updated = await prisma.paymentTransaction.update({
    where: { id: paymentId },
    data: {
      paymentStatus: verified ? 'VERIFIED' : 'FAILED',
      verifiedAt: verified ? new Date() : null,
      verifiedBy: userId,
      notes: notes || payment.notes,
    },
  });

  // Update booking if verified
  if (verified) {
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        depositPaid: true,
        depositVerifiedAt: new Date(),
      },
    });

    // Notify client
    await createNotification({
      userId: payment.booking.clientId,
      type: 'DEPOSIT_VERIFIED',
      title: 'Deposit Verified',
      message: 'Your deposit has been verified',
      relatedEntityType: 'booking',
      relatedEntityId: payment.bookingId,
    });

    // Notify performer
    await createNotification({
      userId: payment.booking.performer.userId,
      type: 'DEPOSIT_VERIFIED',
      title: 'Booking Deposit Verified',
      message: 'Deposit verified for new booking',
      relatedEntityType: 'booking',
      relatedEntityId: payment.bookingId,
    });
  } else {
    // Notify client
    await createNotification({
      userId: payment.booking.clientId,
      type: 'SYSTEM_ALERT',
      title: 'Deposit Verification Failed',
      message: 'Your deposit could not be verified',
      relatedEntityType: 'booking',
      relatedEntityId: payment.bookingId,
    });
  }

  // Create audit log
  await createAuditLog({
    userId,
    action: verified ? 'DEPOSIT_VERIFIED' : 'DEPOSIT_REJECTED',
    entity: 'payment',
    entityId: paymentId,
    changes: {
      verified,
      notes,
    },
  });

  return successResponse(updated, 'Deposit ' + (verified ? 'verified' : 'rejected'));
}

export const POST = withErrorHandler(handler);
