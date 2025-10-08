/**
 * POST /api/payments/[bookingId]/deposit/upload
 * Upload deposit receipt
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withErrorHandler, successResponse, errorResponse, requireAuth, validateRequest } from '@/lib/api-utils';
import { prisma, createAuditLog, createNotification } from '@/lib/db';

const uploadSchema = z.object({
  receiptImageUrl: z.string().url(),
  payidReference: z.string().optional(),
  amount: z.number().positive(),
  notes: z.string().optional(),
});

async function handler(
  request: NextRequest,
  context: { params: { bookingId: string } }
) {
  const authResult = await requireAuth(request, ['CLIENT']);
  if (authResult instanceof Response) {
    return authResult;
  }

  const { userId } = authResult;
  const { bookingId } = context.params;

  const validation = await validateRequest(request, uploadSchema);
  if ('error' in validation) {
    return validation.error;
  }

  const data = validation.data;

  // Get booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      performer: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!booking) {
    return errorResponse('Booking not found', 404);
  }

  if (booking.clientId !== userId) {
    return errorResponse('Not authorized for this booking', 403);
  }

  if (booking.status !== 'PENDING_DEPOSIT') {
    return errorResponse('Booking is not pending deposit', 400);
  }

  // Create or update payment transaction
  const payment = await prisma.paymentTransaction.upsert({
    where: { bookingId },
    create: {
      bookingId,
      paymentMethod: 'PAYID',
      paymentStatus: 'PENDING',
      amount: data.amount,
      receiptImageUrl: data.receiptImageUrl,
      payidReference: data.payidReference,
      notes: data.notes,
    },
    update: {
      receiptImageUrl: data.receiptImageUrl,
      payidReference: data.payidReference,
      amount: data.amount,
      notes: data.notes,
      paymentStatus: 'PENDING',
    },
  });

  // Update booking status
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'PENDING_APPROVAL',
    },
  });

  // Create audit log
  await createAuditLog({
    userId,
    action: 'DEPOSIT_UPLOADED',
    entity: 'payment',
    entityId: payment.id,
    changes: {
      bookingId,
      amount: data.amount,
    },
  });

  // Notify admin (first admin user)
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (admin) {
    await createNotification({
      userId: admin.id,
      type: 'DEPOSIT_UPLOADED',
      title: 'Deposit Receipt Uploaded',
      message: `New deposit receipt uploaded for booking ${booking.bookingRef}`,
      relatedEntityType: 'booking',
      relatedEntityId: bookingId,
    });
  }

  return successResponse(payment, 'Deposit receipt uploaded successfully');
}

export const POST = withErrorHandler(handler);
