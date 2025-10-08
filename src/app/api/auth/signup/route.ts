/**
 * POST /api/auth/signup
 * User registration with bcrypt password hashing
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { withErrorHandler, successResponse, errorResponse, validateRequest, getClientIp, getUserAgent } from '@/lib/api-utils';
import { prisma, checkDNSList, createAuditLog } from '@/lib/db';
import { registerSchema } from '@/lib/validators';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function handler(request: NextRequest) {
  // Validate request body
  const validation = await validateRequest(request, registerSchema);
  if ('error' in validation) {
    return validation.error;
  }

  const { email, password, displayName, role } = validation.data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    return errorResponse('An account with this email already exists', 409);
  }

  // Check DNS list
  const isBlacklisted = await checkDNSList(email);
  if (isBlacklisted) {
    // Log the attempt but don't reveal blacklist status
    await createAuditLog({
      action: 'SIGNUP_BLOCKED',
      entity: 'user',
      changes: { email, reason: 'DNS_LIST' },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });
    return errorResponse('Unable to create account. Please contact support.', 403);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      firstName: displayName,
      role: role.toUpperCase() as 'CLIENT' | 'PERFORMER',
    },
  });

  // If performer, create performer profile
  if (role === 'performer') {
    await prisma.performer.create({
      data: {
        userId: user.id,
        stageName: displayName,
        availabilityStatus: 'OFFLINE',
      },
    });
  }

  // Create audit log
  await createAuditLog({
    userId: user.id,
    action: 'USER_SIGNUP',
    entity: 'user',
    entityId: user.id,
    changes: { email: user.email, role: user.role },
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });

  // Generate JWT token
  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return successResponse(
    {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
      },
    },
    'Account created successfully'
  );
}

export const POST = withErrorHandler(handler);
