import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  validatePayID,
  createPayIDAccount,
  calculatePaymentFees
} from '@/lib/services/payid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create PayID payment request
export async function POST(request: NextRequest) {
  try {
    const { bookingId, payerId, recipientId, amount, description } = await request.json();

    if (!bookingId || !payerId || !recipientId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For now, return payment request info
    // This would integrate with the new PayID transaction API routes
    const fees = calculatePaymentFees(amount, 'payid');

    return NextResponse.json({
      success: true,
      paymentInfo: {
        amount,
        fees: fees.feeAmount,
        netAmount: fees.netAmount,
        message: 'Use /api/payid/transactions endpoint for new PayID payments'
      }
    });

  } catch (error: any) {
    console.error('PayID payment creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get PayID accounts for user
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // This endpoint is deprecated in favor of /api/payid/accounts
    return NextResponse.json({
      success: true,
      accounts: [],
      message: 'Use /api/payid/accounts endpoint for PayID account management'
    });

  } catch (error: any) {
    console.error('Get PayID accounts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}