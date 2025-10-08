/**
 * GET /api/me
 * Get current user profile
 */

import { NextRequest } from 'next/server';
import { withErrorHandler, successResponse, errorResponse, requireAuth } from '@/lib/api-utils';
import { prisma } from '@/lib/db';

async function handler(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) {
    return authResult;
  }

  const { userId } = authResult;

  // Get user with relations
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      performer: {
        include: {
          services: {
            include: {
              service: true,
            },
          },
          vettingApplication: true,
        },
      },
      notifications: {
        where: { isRead: false },
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!user) {
    return errorResponse('User not found', 404);
  }

  // Format response
  const response = {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    dateOfBirth: user.dateOfBirth,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    performer: user.performer ? {
      id: user.performer.id,
      stageName: user.performer.stageName,
      bio: user.performer.bio,
      profileImageUrl: user.performer.profileImageUrl,
      galleryImages: user.performer.galleryImages,
      availabilityStatus: user.performer.availabilityStatus,
      isVerified: user.performer.isVerified,
      isActive: user.performer.isActive,
      rating: user.performer.rating,
      totalBookings: user.performer.totalBookings,
      hourlyRate: user.performer.hourlyRate,
      whatsappNumber: user.performer.whatsappNumber,
      preferredLocations: user.performer.preferredLocations,
      services: user.performer.services.map(ps => ({
        id: ps.service.id,
        name: ps.service.name,
        category: ps.service.category,
        customPrice: ps.customPrice,
        isOffered: ps.isOffered,
      })),
      vettingStatus: user.performer.vettingApplication?.status || null,
    } : null,
    unreadNotifications: user.notifications.length,
  };

  return successResponse(response);
}

export const GET = withErrorHandler(handler);
