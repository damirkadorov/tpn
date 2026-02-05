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

// In-memory storage
declare global {
  var payments: Map<string, Payment> | undefined;
}

const payments: Map<string, Payment> = global.payments || (global.payments = new Map());

export default async (req: VercelRequest, res: VercelResponse): Promise<void> => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
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

  // Return only necessary info for the payment page
  res.json({
    paymentId: payment.paymentId,
    amount: payment.amount,
    currency: payment.currency,
    description: payment.description,
    fee: payment.fee,
    totalAmount: payment.totalAmount,
    status: payment.status
  });
};
