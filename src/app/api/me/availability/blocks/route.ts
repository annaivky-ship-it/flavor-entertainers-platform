/**
 * POST /api/me/availability/blocks
 * Create availability time blocks
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withErrorHandler, successResponse, errorResponse, requireAuth, validateRequest } from '@/lib/api-utils';
import { prisma } from '@/lib/db';

const blockSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isRecurring: z.boolean().optional(),
  recurringDayOfWeek: z.number().min(0).max(6).optional(),
});

async function handler(request: NextRequest) {
  const authResult = await requireAuth(request, ['PERFORMER']);
  if (authResult instanceof Response) {
    return authResult;
  }

  const { userId } = authResult;

  const validation = await validateRequest(request, blockSchema);
  if ('error' in validation) {
    return validation.error;
  }

  const data = validation.data;

  // Get performer
  const performer = await prisma.performer.findUnique({
    where: { userId },
  });

  if (!performer) {
    return errorResponse('Performer profile not found', 404);
  }

  // Create availability block
  const availability = await prisma.availability.create({
    data: {
      performerId: performer.id,
      date: new Date(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
      isAvailable: true,
      isRecurring: data.isRecurring || false,
      recurringDayOfWeek: data.recurringDayOfWeek,
    },
  });

  return successResponse(availability, 'Availability block created');
}

export const POST = withErrorHandler(handler);
