/**
 * POST /api/bookings/[id]/performer-respond
 * Performer accept/reject booking
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withErrorHandler, successResponse, errorResponse, requireAuth, validateRequest } from '@/lib/api-utils';
import { prisma, createAuditLog, createNotification } from '@/lib/db';

const responseSchema = z.object({
  accepted: z.boolean(),
  notes: z.string().optional(),
});

async function handler(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const authResult = await requireAuth(request, ['PERFORMER']);
  if (authResult instanceof Response) {
    return authResult;
  }

  const { userId } = authResult;
  const { id } = context.params;

  const validation = await validateRequest(request, responseSchema);
  if ('error' in validation) {
    return validation.error;
  }

  const { accepted, notes } = validation.data;

  // Get performer
  const performer = await prisma.performer.findUnique({
    where: { userId },
  });

  if (!performer) {
    return errorResponse('Performer profile not found', 404);
  }

  // Get booking
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      client: true,
    },
  });

  if (!booking) {
    return errorResponse('Booking not found', 404);
  }

  if (booking.performerId !== performer.id) {
    return errorResponse('Not authorized for this booking', 403);
  }

  if (booking.status !== 'APPROVED') {
    return errorResponse('Booking is not in approved state', 400);
  }

  // Update booking
  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status: accepted ? 'CONFIRMED' : 'REJECTED',
      confirmedByPerformerAt: accepted ? new Date() : null,
      cancellationReason: !accepted ? (notes || 'Rejected by performer') : null,
    },
  });

  // Create audit log
  await createAuditLog({
    userId,
    action: accepted ? 'BOOKING_CONFIRMED' : 'BOOKING_REJECTED',
    entity: 'booking',
    entityId: id,
    changes: {
      accepted,
      notes,
    },
  });

  // Notify client
  await createNotification({
    userId: booking.clientId,
    type: accepted ? 'BOOKING_CONFIRMED' : 'BOOKING_CANCELLED',
    title: accepted ? 'Booking Confirmed' : 'Booking Rejected',
    message: accepted
      ? 'Your booking has been confirmed by the performer'
      : `Your booking was rejected: ${notes || 'No reason provided'}`,
    relatedEntityType: 'booking',
    relatedEntityId: id,
  });

  return successResponse(updated, `Booking ${accepted ? 'confirmed' : 'rejected'}`);
}

export const POST = withErrorHandler(handler);
