/**
 * GET /api/services
 * List all active services
 */

import { NextRequest } from 'next/server';
import { withErrorHandler, successResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/db';

async function handler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  // Build query
  const where: any = { isActive: true };
  if (category) {
    where.category = category.toUpperCase();
  }

  // Get all active services
  const services = await prisma.service.findMany({
    where,
    orderBy: [
      { category: 'asc' },
      { name: 'asc' },
    ],
    include: {
      _count: {
        select: {
          performers: {
            where: {
              isOffered: true,
            },
          },
        },
      },
    },
  });

  // Format response
  const formattedServices = services.map(service => ({
    id: service.id,
    name: service.name,
    description: service.description,
    category: service.category,
    basePrice: service.basePrice,
    duration: service.duration,
    availablePerformers: service._count.performers,
  }));

  return successResponse(formattedServices);
}

export const GET = withErrorHandler(handler);