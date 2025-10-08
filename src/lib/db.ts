/**
 * Database utilities and Prisma client singleton
 * Provides database helper functions and client management
 */

import { PrismaClient } from '@prisma/client';
import { BookingStatus } from '@prisma/client';
import { createAdminClient } from './supabase';

// Export Supabase client for existing code compatibility
export const db = createAdminClient();

// Prisma client singleton pattern for serverless environments
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Generate unique booking reference
 * Format: BK-{timestamp}-{random}
 */
export function generateBookingRef(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${timestamp}-${random}`;
}

/**
 * Calculate deposit amount (50% of total)
 */
export function calculateDeposit(totalAmount: number): number {
  return Math.round(totalAmount * 0.5 * 100) / 100; // 50% deposit, rounded to 2 decimals
}

/**
 * Check if email or phone is in DNS (Do Not Service) list
 */
export async function checkDNSList(email?: string, phone?: string): Promise<boolean> {
  if (!email && !phone) return false;

  const dnsEntry = await prisma.dnsList.findFirst({
    where: {
      AND: [
        { isActive: true },
        {
          OR: [
            email ? { email: email.toLowerCase() } : {},
            phone ? { phone } : {},
          ].filter(obj => Object.keys(obj).length > 0),
        },
      ],
    },
  });

  return !!dnsEntry;
}

/**
 * Create audit log entry
 */
export async function createAuditLog(data: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: data.userId,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      changes: data.changes ? JSON.stringify(data.changes) : null,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
  });
}

/**
 * Get booking statistics for a performer
 */
export async function getPerformerStats(performerId: string) {
  const [totalBookings, completedBookings, rating] = await Promise.all([
    prisma.booking.count({
      where: { performerId },
    }),
    prisma.booking.count({
      where: {
        performerId,
        status: BookingStatus.COMPLETED,
      },
    }),
    prisma.booking.aggregate({
      where: {
        performerId,
        status: BookingStatus.COMPLETED,
      },
      _avg: {
        totalAmount: true,
      },
    }),
  ]);

  return {
    totalBookings,
    completedBookings,
    averageBookingValue: rating._avg.totalAmount || 0,
  };
}

/**
 * Clean up stale bookings (pending deposit > 24 hours)
 */
export async function cleanupStaleBookings(): Promise<number> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const result = await prisma.booking.updateMany({
    where: {
      status: BookingStatus.PENDING_DEPOSIT,
      depositPaid: false,
      createdAt: {
        lt: twentyFourHoursAgo,
      },
    },
    data: {
      status: BookingStatus.CANCELLED,
      cancellationReason: 'Auto-cancelled: Deposit not received within 24 hours',
      cancelledAt: new Date(),
    },
  });

  return result.count;
}

/**
 * Delete old notifications (> 30 days)
 */
export async function cleanupOldNotifications(): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await prisma.notification.deleteMany({
    where: {
      createdAt: {
        lt: thirtyDaysAgo,
      },
      isRead: true,
    },
  });

  return result.count;
}

/**
 * Check performer availability for a specific date/time
 */
export async function checkPerformerAvailability(
  performerId: string,
  date: Date,
  startTime: string,
  durationMinutes: number
): Promise<boolean> {
  // Parse start time to get end time
  const [hours, minutes] = startTime.split(':').map(Number);
  const endMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;
  const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

  // Check if performer has availability block for this date
  const availability = await prisma.availability.findFirst({
    where: {
      performerId,
      date: {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(23, 59, 59, 999)),
      },
      isAvailable: true,
      startTime: {
        lte: startTime,
      },
      endTime: {
        gte: endTime,
      },
    },
  });

  if (!availability) return false;

  // Check for conflicting bookings
  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      performerId,
      scheduledDate: {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(23, 59, 59, 999)),
      },
      status: {
        in: [
          BookingStatus.APPROVED,
          BookingStatus.CONFIRMED,
          BookingStatus.PENDING_APPROVAL,
        ],
      },
      scheduledTime: {
        lte: endTime,
      },
    },
  });

  return !conflictingBooking;
}

/**
 * Create notification for user
 */
export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type as any,
      title: data.title,
      message: data.message,
      relatedEntityType: data.relatedEntityType,
      relatedEntityId: data.relatedEntityId,
    },
  });
}

export default prisma;
