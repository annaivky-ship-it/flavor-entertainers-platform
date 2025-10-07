/**
 * GET /api/performers
 * List performers with filters
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withErrorHandler, successResponse, parsePagination, paginatedResponse, validateQuery } from '@/lib/api-utils';
import { prisma } from '@/lib/db';

const filterSchema = z.object({
  category: z.enum(['MASSAGE', 'COMPANIONSHIP', 'ENTERTAINMENT', 'INTIMATE', 'BESPOKE']).optional(),
  location: z.string().optional(),
  availabilityStatus: z.enum(['AVAILABLE', 'BUSY', 'OFFLINE']).optional(),
  isVerified: z.coerce.boolean().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
});

async function handler(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Parse pagination
  const { page, limit, skip } = parsePagination(searchParams);

  // Parse filters
  const validation = validateQuery(request, filterSchema);
  const filters = 'error' in validation ? {} : validation.data;

  // Build where clause
  const where: any = {
    isActive: true,
  };

  if (filters.availabilityStatus) {
    where.availabilityStatus = filters.availabilityStatus;
  }

  if (filters.isVerified !== undefined) {
    where.isVerified = filters.isVerified;
  }

  if (filters.minRating) {
    where.rating = {
      gte: filters.minRating,
    };
  }

  if (filters.location) {
    where.preferredLocations = {
      has: filters.location,
    };
  }

  // Get performers with services
  const [performers, total] = await Promise.all([
    prisma.performer.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
          },
        },
        services: {
          where: {
            isOffered: true,
          },
          include: {
            service: true,
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: [
        { isVerified: 'desc' },
        { rating: 'desc' },
        { createdAt: 'desc' },
      ],
    }),
    prisma.performer.count({ where }),
  ]);

  // Format response
  const formattedPerformers = performers.map(p => ({
    id: p.id,
    stageName: p.stageName,
    bio: p.bio,
    profileImageUrl: p.profileImageUrl,
    availabilityStatus: p.availabilityStatus,
    isVerified: p.isVerified,
    rating: p.rating,
    totalBookings: p.totalBookings,
    hourlyRate: p.hourlyRate,
    services: p.services.map(ps => ({
      id: ps.service.id,
      name: ps.service.name,
      category: ps.service.category,
      price: ps.customPrice || ps.service.basePrice,
    })),
  }));

  return successResponse(paginatedResponse(formattedPerformers, total, page, limit));
}

export const GET = withErrorHandler(handler);