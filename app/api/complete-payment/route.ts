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

interface WebhookPayload {
  event: string;
  paymentId: string;
  amount: number;
  currency: string;
  orderId: string;
  timestamp: string;
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
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get('paymentId');

  if (!paymentId) {
    return NextResponse.json({ error: 'Payment ID is required' }, { status: 400, headers: corsHeaders });
  }

  const payment = payments.get(paymentId);

  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404, headers: corsHeaders });
  }

  if (payment.status === 'completed') {
    return NextResponse.json({ error: 'Payment already completed' }, { status: 400, headers: corsHeaders });
  }

  // Update payment status
  payment.status = 'completed';
  payment.completedAt = new Date().toISOString();
  payments.set(paymentId, payment);

  // Send webhook notification (if webhookUrl provided)
  // Note: This is a simplified implementation. In production, implement:
  // - Retry logic with exponential backoff for failed deliveries
  // - Webhook signature verification (HMAC)
  // - Delivery status tracking and queuing
  // - Dead letter queue for permanently failed webhooks
  if (payment.webhookUrl) {
    const webhookPayload: WebhookPayload = {
      event: 'payment.completed',
      paymentId: payment.paymentId,
      amount: payment.amount,
      currency: payment.currency,
      orderId: payment.orderId,
      timestamp: payment.completedAt
    };
    
    // Fire-and-forget webhook delivery (don't block the response)
    fetch(payment.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    }).catch((error) => {
      // Log error but don't fail the payment completion
      // In production, queue for retry
      console.error('Webhook delivery failed:', error);
    });
  }

  return NextResponse.json({
    success: true,
    paymentId: payment.paymentId,
    status: payment.status,
    redirectUrl: payment.successUrl
  }, { headers: corsHeaders });
}
