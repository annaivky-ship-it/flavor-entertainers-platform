/**
 * GET /api/bookings/[id]
 * Get booking details
 */

import { NextRequest } from 'next/server';
import { withErrorHandler, successResponse, errorResponse, requireAuth } from '@/lib/api-utils';
import { prisma } from '@/lib/db';

async function handler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) {
    return authResult;
  }

  const { userId, role } = authResult;
  const { id } = params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      service: true,
      performer: {
        include: {
          user: {
            select: {
              email: true,
              phone: true,
            },
          },
        },
      },
      client: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      paymentTransaction: true,
    },
  });

  if (!booking) {
    return errorResponse('Booking not found', 404);
  }

  // Authorization check
  if (role === 'CLIENT' && booking.clientId !== userId) {
    return errorResponse('Not authorized to view this booking', 403);
  }

  if (role === 'PERFORMER') {
    const performer = await prisma.performer.findUnique({
      where: { userId },
    });
    if (!performer || booking.performerId !== performer.id) {
      return errorResponse('Not authorized to view this booking', 403);
    }
  }

  return successResponse(booking);
}

export const GET = withErrorHandler(handler);
