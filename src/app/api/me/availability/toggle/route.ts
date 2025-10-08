/**
 * POST /api/me/availability/toggle
 * Toggle performer availability status
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withErrorHandler, successResponse, errorResponse, requireAuth, validateRequest } from '@/lib/api-utils';
import { prisma, createAuditLog } from '@/lib/db';

const toggleSchema = z.object({
  status: z.enum(['AVAILABLE', 'BUSY', 'OFFLINE']),
});

async function handler(request: NextRequest) {
  const authResult = await requireAuth(request, ['PERFORMER']);
  if (authResult instanceof Response) {
    return authResult;
  }

  const { userId } = authResult;

  const validation = await validateRequest(request, toggleSchema);
  if ('error' in validation) {
    return validation.error;
  }

  const { status } = validation.data;

  // Get performer
  const performer = await prisma.performer.findUnique({
    where: { userId },
  });

  if (!performer) {
    return errorResponse('Performer profile not found', 404);
  }

  // Update availability status
  const updated = await prisma.performer.update({
    where: { id: performer.id },
    data: {
      availabilityStatus: status,
    },
  });

  // Create audit log
  await createAuditLog({
    userId,
    action: 'AVAILABILITY_UPDATED',
    entity: 'performer',
    entityId: performer.id,
    changes: {
      oldStatus: performer.availabilityStatus,
      newStatus: status,
    },
  });

  return successResponse({
    id: updated.id,
    availabilityStatus: updated.availabilityStatus,
  }, 'Availability status updated');
}

export const POST = withErrorHandler(handler);
