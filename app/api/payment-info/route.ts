import { NextRequest, NextResponse } from 'next/server';

// Types
interface Payment {
  paymentId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  orderId: string;
  successUrl?: string;
  webhookUrl?: string;
  fee: number;
  totalAmount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}

// In-memory storage
declare global {
  // eslint-disable-next-line no-var
  var payments: Map<string, Payment> | undefined;
}

const payments: Map<string, Payment> = global.payments || (global.payments = new Map());

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get('paymentId');

  if (!paymentId) {
    return NextResponse.json({ error: 'Payment ID is required' }, { status: 400, headers: corsHeaders });
  }

  const payment = payments.get(paymentId);

  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404, headers: corsHeaders });
  }

  // Return only necessary info for the payment page
  return NextResponse.json({
    paymentId: payment.paymentId,
    amount: payment.amount,
    currency: payment.currency,
    description: payment.description,
    fee: payment.fee,
    totalAmount: payment.totalAmount,
    status: payment.status
  }, { headers: corsHeaders });
}
