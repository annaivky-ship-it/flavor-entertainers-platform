/**
 * POST /api/bookings - Create new booking
 * GET /api/bookings - List user's bookings
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withErrorHandler, successResponse, errorResponse, requireAuth, validateRequest, getClientIp, getUserAgent } from '@/lib/api-utils';
import { prisma, generateBookingRef, calculateDeposit, checkDNSList, createAuditLog, createNotification } from '@/lib/db';

const createBookingSchema = z.object({
  performerId: z.string().uuid(),
  serviceId: z.string().uuid(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.number().min(15),
  location: z.string().min(10),
  specialRequests: z.string().optional(),
});

async function createHandler(request: NextRequest) {
  const authResult = await requireAuth(request, ['CLIENT']);
  if (authResult instanceof Response) {
    return authResult;
  }

  const { userId, email } = authResult;

  const validation = await validateRequest(request, createBookingSchema);
  if ('error' in validation) {
    return validation.error;
  }

  const data = validation.data;

  // Check DNS list
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return errorResponse('User not found', 404);
  }

  const isBlacklisted = await checkDNSList(user.email, user.phone || undefined);
  if (isBlacklisted) {
    await createAuditLog({
      userId,
      action: 'BOOKING_BLOCKED',
      entity: 'booking',
      changes: { reason: 'DNS_LIST' },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });
    return errorResponse('Unable to create booking. Please contact support.', 403);
  }

  // Get service and calculate price
  const service = await prisma.service.findUnique({
    where: { id: data.serviceId },
  });

  if (!service) {
    return errorResponse('Service not found', 404);
  }

  // Check performer service pricing
  const performerService = await prisma.performerService.findFirst({
    where: {
      performerId: data.performerId,
      serviceId: data.serviceId,
      isOffered: true,
    },
  });

  if (!performerService) {
    return errorResponse('Performer does not offer this service', 400);
  }

  const pricePerHour = performerService.customPrice || service.basePrice;
  const totalAmount = (pricePerHour * data.duration) / 60;
  const depositAmount = calculateDeposit(totalAmount);

  // Generate booking reference
  const bookingRef = generateBookingRef();

  // Create booking
  const booking = await prisma.booking.create({
    data: {
      bookingRef,
      clientId: userId,
      performerId: data.performerId,
      serviceId: data.serviceId,
      scheduledDate: new Date(data.scheduledDate),
      scheduledTime: data.scheduledTime,
      duration: data.duration,
      location: data.location,
      specialRequests: data.specialRequests,
      totalAmount,
      depositAmount,
      status: 'PENDING_DEPOSIT',
    },
    include: {
      service: true,
      performer: true,
    },
  });

  // Create audit log
  await createAuditLog({
    userId,
    action: 'BOOKING_CREATED',
    entity: 'booking',
    entityId: booking.id,
    changes: {
      bookingRef,
      performerId: data.performerId,
      serviceId: data.serviceId,
      totalAmount,
    },
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });

  // Create notification for performer
  await createNotification({
    userId: booking.performer.userId,
    type: 'BOOKING_CREATED',
    title: 'New Booking Request',
    message: `You have a new booking request for ${service.name}`,
    relatedEntityType: 'booking',
    relatedEntityId: booking.id,
  });

  return successResponse(booking, 'Booking created successfully');
}

async function listHandler(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) {
    return authResult;
  }

  const { userId, role } = authResult;

  const where: any = {};

  if (role === 'CLIENT') {
    where.clientId = userId;
  } else if (role === 'PERFORMER') {
    const performer = await prisma.performer.findUnique({
      where: { userId },
    });
    if (!performer) {
      return errorResponse('Performer profile not found', 404);
    }
    where.performerId = performer.id;
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      service: true,
      performer: {
        select: {
          id: true,
          stageName: true,
          profileImageUrl: true,
        },
      },
      client: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      paymentTransaction: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return successResponse(bookings);
}

async function handler(request: NextRequest) {
  if (request.method === 'POST') {
    return createHandler(request);
  } else if (request.method === 'GET') {
    return listHandler(request);
  }
  return errorResponse('Method not allowed', 405);
}

export const POST = withErrorHandler(createHandler);
export const GET = withErrorHandler(listHandler);
