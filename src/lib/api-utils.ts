/**
 * API Utilities
 * Request/response helpers, auth middleware, and error handlers
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, z } from 'zod';
import { createAuditLog } from './db';

// Standard API response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: any;
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
  });
}

/**
 * Error response helper
 */
export function errorResponse(
  error: string,
  status: number = 400,
  details?: any
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      success: false,
      error,
      details,
    },
    { status }
  );
}

/**
 * Get user from request (requires auth middleware to have run first)
 */
export function getUserFromRequest(request: NextRequest): {
  userId: string;
  email: string;
  role: string;
} | null {
  const userId = request.headers.get('x-user-id');
  const email = request.headers.get('x-user-email');
  const role = request.headers.get('x-user-role');

  if (!userId || !email || !role) {
    return null;
  }

  return { userId, email, role };
}

/**
 * Require authentication middleware
 */
export async function requireAuth(
  request: NextRequest,
  allowedRoles?: string[]
): Promise<{ userId: string; email: string; role: string } | NextResponse> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse('Unauthorized: No token provided', 401);
  }

  const token = authHeader.substring(7);

  // TODO: Verify JWT token here
  // For now, we'll decode it (in production, use proper JWT verification)
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

    if (!payload.sub || !payload.email || !payload.role) {
      return errorResponse('Unauthorized: Invalid token', 401);
    }

    // Check role if specified
    if (allowedRoles && !allowedRoles.includes(payload.role)) {
      return errorResponse('Forbidden: Insufficient permissions', 403);
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch (error) {
    return errorResponse('Unauthorized: Invalid token', 401);
  }
}

/**
 * Validate request body against Zod schema
 */
export async function validateRequest<T extends ZodSchema>(
  request: NextRequest,
  schema: T
): Promise<{ data: z.infer<T> } | { error: NextResponse }> {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    return { data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: errorResponse(
          'Validation error',
          400,
          error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        ),
      };
    }
    return {
      error: errorResponse('Invalid request body', 400),
    };
  }
}

/**
 * Validate query parameters against Zod schema
 */
export function validateQuery<T extends ZodSchema>(
  request: NextRequest,
  schema: T
): { data: z.infer<T> } | { error: NextResponse } {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const validated = schema.parse(params);
    return { data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: errorResponse(
          'Invalid query parameters',
          400,
          error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        ),
      };
    }
    return {
      error: errorResponse('Invalid query parameters', 400),
    };
  }
}

/**
 * Error handler wrapper for API routes
 */
export function withErrorHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Error:', error);

      // Log error to audit log
      const user = getUserFromRequest(request);
      if (user) {
        await createAuditLog({
          userId: user.userId,
          action: 'API_ERROR',
          entity: 'system',
          changes: {
            error: error instanceof Error ? error.message : 'Unknown error',
            url: request.url,
            method: request.method,
          },
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        }).catch(console.error);
      }

      if (error instanceof Error) {
        return errorResponse(error.message, 500);
      }

      return errorResponse('Internal server error', 500);
    }
  };
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: NextRequest): string | undefined {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    undefined
  );
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: NextRequest): string | undefined {
  return request.headers.get('user-agent') || undefined;
}

/**
 * Parse pagination parameters
 */
export function parsePagination(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Create paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): ApiResponse<{
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    data: {
      items: data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  };
}

/**
 * Handle multipart form data (for file uploads)
 */
export async function parseFormData(request: NextRequest): Promise<FormData> {
  try {
    return await request.formData();
  } catch (error) {
    throw new Error('Failed to parse form data');
  }
}

/**
 * Create audit log from request
 */
export async function auditRequest(
  request: NextRequest,
  action: string,
  entity: string,
  entityId?: string,
  changes?: Record<string, any>
): Promise<void> {
  const user = getUserFromRequest(request);

  await createAuditLog({
    userId: user?.userId,
    action,
    entity,
    entityId,
    changes,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });
}

/**
 * Rate limiting helper (simple in-memory implementation)
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    const resetAt = now + windowMs;
    rateLimitMap.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

/**
 * CORS headers helper
 */
export function corsHeaders(origin?: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handle OPTIONS request for CORS
 */
export function handleOptions(origin?: string): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}
