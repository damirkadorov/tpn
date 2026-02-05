import { VercelRequest, VercelResponse } from '@vercel/node';

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
  var payments: Map<string, Payment> | undefined;
}

const payments: Map<string, Payment> = global.payments || (global.payments = new Map());

export default async (req: VercelRequest, res: VercelResponse): Promise<void> => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { paymentId } = req.query;

  if (!paymentId || typeof paymentId !== 'string') {
    res.status(400).json({ error: 'Payment ID is required' });
    return;
  }

  const payment = payments.get(paymentId);

  if (!payment) {
    res.status(404).json({ error: 'Payment not found' });
    return;
  }

  if (payment.status === 'completed') {
    res.status(400).json({ error: 'Payment already completed' });
    return;
  }

  // Update payment status
  payment.status = 'completed';
  payment.completedAt = new Date().toISOString();
  payments.set(paymentId, payment);

  // Send webhook notification (if webhookUrl provided)
  if (payment.webhookUrl) {
    const webhookPayload: WebhookPayload = {
      event: 'payment.completed',
      paymentId: payment.paymentId,
      amount: payment.amount,
      currency: payment.currency,
      orderId: payment.orderId,
      timestamp: payment.completedAt
    };
    
    // Log webhook info in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Webhook would be sent to:', payment.webhookUrl);
      console.log('Webhook payload:', webhookPayload);
    }

    // Note: Webhook delivery is intentionally simplified for this demo
    // In production, implement:
    // 1. Actual HTTP request with proper error handling
    // 2. Retry logic for failed deliveries
    // 3. Webhook signature verification
    // 4. Delivery status tracking
    // 
    // Example implementation:
    // try {
    //   await fetch(payment.webhookUrl, {
    //     method: 'POST',
    //     headers: { 
    //       'Content-Type': 'application/json',
    //       'X-Webhook-Signature': signPayload(webhookPayload, secret)
    //     },
    //     body: JSON.stringify(webhookPayload)
    //   });
    // } catch (error) {
    //   console.error('Webhook delivery failed:', error);
    //   // Implement retry logic here
    // }
  }

  res.json({
    success: true,
    paymentId: payment.paymentId,
    status: payment.status,
    redirectUrl: payment.successUrl
  });
};
