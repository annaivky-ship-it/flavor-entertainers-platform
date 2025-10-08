/**
 * POST /api/bookings/[id]/admin-approve
 * Admin approve booking
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withErrorHandler, successResponse, errorResponse, requireAuth, validateRequest, getClientIp } from '@/lib/api-utils';
import { prisma, createAuditLog, createNotification } from '@/lib/db';

const approvalSchema = z.object({
  approved: z.boolean(),
  notes: z.string().optional(),
});

async function handler(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const authResult = await requireAuth(request, ['ADMIN']);
  if (authResult instanceof Response) {
    return authResult;
  }

  const userId = authResult.userId;
  const id = context.params.id;

  const validation = await validateRequest(request, approvalSchema);
  if ('error' in validation) {
    return validation.error;
  }

  const approved = validation.data.approved;
  const notes = validation.data.notes;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      client: true,
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

  if (booking.status !== 'PENDING_APPROVAL') {
    return errorResponse('Booking is not pending approval', 400);
  }

  // Update booking status
  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status: approved ? 'APPROVED' : 'REJECTED',
      approvedByAdminAt: approved ? new Date() : null,
      cancellationReason: !approved ? (notes || 'Rejected by admin') : null,
    },
  });

  // Create audit log
  await createAuditLog({
    userId,
    action: approved ? 'BOOKING_APPROVED' : 'BOOKING_REJECTED',
    entity: 'booking',
    entityId: id,
    changes: {
      approved,
      notes,
      oldStatus: booking.status,
      newStatus: updated.status,
    },
    ipAddress: getClientIp(request),
  });

  // Notify client
  await createNotification({
    userId: booking.clientId,
    type: approved ? 'BOOKING_APPROVED' : 'BOOKING_CANCELLED',
    title: approved ? 'Booking Approved' : 'Booking Rejected',
    message: approved
      ? 'Your booking has been approved by admin'
      : 'Your booking was rejected',
    relatedEntityType: 'booking',
    relatedEntityId: id,
  });

  // Notify performer
  await createNotification({
    userId: booking.performer.userId,
    type: approved ? 'BOOKING_APPROVED' : 'BOOKING_CANCELLED',
    title: approved ? 'Booking Approved' : 'Booking Rejected',
    message: approved
      ? 'A booking has been approved'
      : 'A booking was rejected by admin',
    relatedEntityType: 'booking',
    relatedEntityId: id,
  });

  const message = approved ? 'approved' : 'rejected';
  return successResponse(updated, 'Booking ' + message);
}

export const POST = withErrorHandler(handler);
