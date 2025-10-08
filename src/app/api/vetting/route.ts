/**
 * POST /api/vetting - Submit vetting application
 * GET /api/vetting/me - Get my vetting status (will be in /api/vetting/me/route.ts)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withErrorHandler, successResponse, errorResponse, requireAuth, validateRequest } from '@/lib/api-utils';
import { prisma, createAuditLog, createNotification } from '@/lib/db';

const vettingSchema = z.object({
  fullLegalName: z.string().min(2),
  idType: z.enum(['passport', 'drivers_license', 'national_id']),
  idNumber: z.string().min(5),
  idDocumentUrl: z.string().url(),
  selfieWithIdUrl: z.string().url(),
  proofOfAgeUrl: z.string().url().optional(),
  policeCheckUrl: z.string().url().optional(),
  contactNumber: z.string(),
  emergencyContact: z.string(),
  emergencyPhone: z.string(),
  consentAgreed: z.boolean().refine(val => val === true),
});

async function handler(request: NextRequest) {
  const authResult = await requireAuth(request, ['PERFORMER']);
  if (authResult instanceof Response) {
    return authResult;
  }

  const { userId } = authResult;

  const validation = await validateRequest(request, vettingSchema);
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

  // Check existing application
  const existing = await prisma.vettingApplication.findUnique({
    where: { performerId: performer.id },
  });

  if (existing && existing.status === 'PENDING') {
    return errorResponse('You already have a pending vetting application', 409);
  }

  if (existing && existing.status === 'APPROVED') {
    return errorResponse('You are already verified', 400);
  }

  // Create or update application
  const application = await prisma.vettingApplication.upsert({
    where: { performerId: performer.id },
    create: {
      performerId: performer.id,
      ...data,
      status: 'PENDING',
    },
    update: {
      ...data,
      status: 'PENDING',
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: null,
      rejectionReason: null,
    },
  });

  // Create audit log
  await createAuditLog({
    userId,
    action: 'VETTING_SUBMITTED',
    entity: 'vetting',
    entityId: application.id,
    changes: {
      performerId: performer.id,
    },
  });

  // Notify admin
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (admin) {
    await createNotification({
      userId: admin.id,
      type: 'SYSTEM_ALERT',
      title: 'New Vetting Application',
      message: `${performer.stageName} submitted a vetting application`,
      relatedEntityType: 'vetting',
      relatedEntityId: application.id,
    });
  }

  return successResponse(application, 'Vetting application submitted successfully');
}

export const POST = withErrorHandler(handler);