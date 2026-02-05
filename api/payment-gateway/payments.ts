import { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';

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

interface PaymentRequest {
  amount: number;
  currency: string;
  description?: string;
  customerEmail: string;
  orderId: string;
  successUrl?: string;
  webhookUrl?: string;
}

interface AuthError {
  error: string;
  status: number;
}

// In-memory storage (in production, use Vercel KV or a database)
// For demo purposes, we'll use a global object that persists during the function's lifetime
declare global {
  var payments: Map<string, Payment> | undefined;
}

const payments: Map<string, Payment> = global.payments || (global.payments = new Map());

const SUPPORTED_CURRENCIES: string[] = ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD'];
const TRANSACTION_FEE_PERCENT: number = 2.5;

// Calculate transaction fee
const calculateFee = (amount: number): number => {
  return (amount * TRANSACTION_FEE_PERCENT) / 100;
};

// Authenticate API Key
const authenticateApiKey = (req: VercelRequest): AuthError | null => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return { error: 'API key is required', status: 401 };
  }
  
  // Get valid API keys from environment variables
  const validApiKeys = process.env.API_KEYS?.split(',').map(key => key.trim()) || [];
  
  // In production, API keys must be configured
  if (validApiKeys.length === 0) {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
      return { error: 'API key configuration missing. Contact system administrator.', status: 500 };
    }
    // Development mode: accept any API key with warning
    console.warn('Warning: No API_KEYS configured in environment variables. Accepting any API key for demo purposes.');
    return null;
  }
  
  // Validate against configured API keys
  if (!validApiKeys.includes(apiKey as string)) {
    return { error: 'Invalid API key', status: 401 };
  }
  
  return null;
};

export default async (req: VercelRequest, res: VercelResponse): Promise<void> => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST - Create payment
  if (req.method === 'POST') {
    // Authenticate
    const authError = authenticateApiKey(req);
    if (authError) {
      res.status(authError.status).json({ error: authError.error });
      return;
    }

    const {
      amount,
      currency,
      description,
      customerEmail,
      orderId,
      successUrl,
      webhookUrl
    } = req.body as PaymentRequest;

    // Validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: 'Valid amount is required' });
      return;
    }

    if (!currency || !SUPPORTED_CURRENCIES.includes(currency)) {
      res.status(400).json({ 
        error: `Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}` 
      });
      return;
    }

    if (!customerEmail || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(customerEmail)) {
      res.status(400).json({ error: 'Valid customer email is required' });
      return;
    }

    if (!orderId) {
      res.status(400).json({ error: 'Order ID is required' });
      return;
    }

    // Create payment
    const paymentId = uuidv4();
    const fee = calculateFee(amount);
    const payment: Payment = {
      paymentId,
      amount,
      currency,
      description: description || '',
      customerEmail,
      orderId,
      successUrl,
      webhookUrl,
      fee,
      totalAmount: amount + fee,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    payments.set(paymentId, payment);

    // Generate payment URL
    const host = req.headers.host || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const paymentUrl = `${protocol}://${host}/payment.html?paymentId=${paymentId}`;

    res.status(201).json({
      paymentId,
      paymentUrl,
      amount,
      currency,
      fee,
      totalAmount: payment.totalAmount,
      status: 'pending'
    });
    return;
  }

  // GET - Get payment status
  if (req.method === 'GET') {
    // Authenticate
    const authError = authenticateApiKey(req);
    if (authError) {
      res.status(authError.status).json({ error: authError.error });
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

    res.json({
      paymentId: payment.paymentId,
      amount: payment.amount,
      currency: payment.currency,
      orderId: payment.orderId,
      status: payment.status,
      fee: payment.fee,
      totalAmount: payment.totalAmount,
      createdAt: payment.createdAt,
      completedAt: payment.completedAt
    });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
