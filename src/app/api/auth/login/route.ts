/**
 * POST /api/auth/login
 * Login with JWT token generation
 */

import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { withErrorHandler, successResponse, errorResponse, validateRequest, getClientIp, getUserAgent } from '@/lib/api-utils';
import { prisma, createAuditLog } from '@/lib/db';
import { loginSchema } from '@/lib/validators';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function handler(request: NextRequest) {
  // Validate request body
  const validation = await validateRequest(request, loginSchema);
  if ('error' in validation) {
    return validation.error;
  }

  const { email, password } = validation.data;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      performer: true,
    },
  });

  if (!user) {
    return errorResponse('Invalid email or password', 401);
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    // Log failed attempt
    await createAuditLog({
      userId: user.id,
      action: 'LOGIN_FAILED',
      entity: 'user',
      entityId: user.id,
      changes: { reason: 'invalid_password' },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });
    return errorResponse('Invalid email or password', 401);
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Create audit log
  await createAuditLog({
    userId: user.id,
    action: 'USER_LOGIN',
    entity: 'user',
    entityId: user.id,
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
        lastName: user.lastName,
        performer: user.performer ? {
          id: user.performer.id,
          stageName: user.performer.stageName,
          isVerified: user.performer.isVerified,
          availabilityStatus: user.performer.availabilityStatus,
        } : null,
      },
    },
    'Login successful'
  );
}

export const POST = withErrorHandler(handler);
