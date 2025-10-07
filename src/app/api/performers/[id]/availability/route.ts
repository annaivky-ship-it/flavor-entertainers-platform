/**
 * GET /api/performers/[id]/availability
 * Get performer availability
 */

import { NextRequest } from 'next/server';
import { withErrorHandler, successResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/db';

async function handler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  // Check performer exists
  const performer = await prisma.performer.findUnique({
    where: { id },
  });

  if (!performer) {
    return errorResponse('Performer not found', 404);
  }

  // Build date range query
  const where: any = {
    performerId: id,
    isAvailable: true,
  };

  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  // Get availability blocks
  const availability = await prisma.availability.findMany({
    where,
    orderBy: {
      date: 'asc',
    },
  });

  return successResponse(availability);
}

export const GET = withErrorHandler(handler);
