/**
 * GET /api/payments/config
 * Get PayID configuration
 */

import { NextRequest } from 'next/server';
import { withErrorHandler, successResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/db';

async function handler(request: NextRequest) {
  // Get PayID settings from system settings
  const settings = await prisma.systemSettings.findMany({
    where: {
      key: {
        in: ['payid_email', 'payid_phone', 'payid_name', 'payid_bsb', 'payid_account'],
      },
    },
  });

  const config: Record<string, string> = {};
  settings.forEach(setting => {
    config[setting.key] = setting.value;
  });

  return successResponse({
    payidEmail: config.payid_email || 'payments@flavorentertainers.com.au',
    payidPhone: config.payid_phone,
    accountName: config.payid_name || 'Flavor Entertainers',
    bsb: config.payid_bsb,
    accountNumber: config.payid_account,
    depositInstructions: 'Please transfer the deposit amount to the PayID details above. Include your booking reference in the payment description.',
  });
}

export const GET = withErrorHandler(handler);
