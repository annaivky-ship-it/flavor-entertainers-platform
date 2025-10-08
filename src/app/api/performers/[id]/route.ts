/**
 * GET /api/performers/[id]
 * Get performer details
 */

import { NextRequest } from 'next/server';
import { withErrorHandler, successResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/db';

async function handler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const performer = await prisma.performer.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          createdAt: true,
        },
      },
      services: {
        where: { isOffered: true },
        include: {
          service: true,
        },
      },
      bookings: {
        where: {
          status: 'COMPLETED',
        },
        select: {
          id: true,
          completedAt: true,
          totalAmount: true,
        },
        orderBy: {
          completedAt: 'desc',
        },
        take: 10,
      },
    },
  });

  if (!performer) {
    return errorResponse('Performer not found', 404);
  }

  // Calculate stats
  const stats = {
    totalCompletedBookings: performer.bookings.length,
    rating: performer.rating,
    totalBookings: performer.totalBookings,
  };

  const response = {
    id: performer.id,
    stageName: performer.stageName,
    bio: performer.bio,
    profileImageUrl: performer.profileImageUrl,
    galleryImages: performer.galleryImages,
    availabilityStatus: performer.availabilityStatus,
    isVerified: performer.isVerified,
    rating: performer.rating,
    totalBookings: performer.totalBookings,
    hourlyRate: performer.hourlyRate,
    whatsappNumber: performer.whatsappNumber,
    preferredLocations: performer.preferredLocations,
    services: performer.services.map(ps => ({
      id: ps.service.id,
      name: ps.service.name,
      description: ps.service.description,
      category: ps.service.category,
      price: ps.customPrice || ps.service.basePrice,
      duration: ps.service.duration,
    })),
    stats,
    recentBookings: performer.bookings,
  };

  return successResponse(response);
}

export const GET = withErrorHandler(handler);
