import { NextRequest, NextResponse } from 'next/server';
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

// In-memory storage (in production, use a database)
declare global {
  // eslint-disable-next-line no-var
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
const authenticateApiKey = (request: NextRequest): { error: string; status: number } | null => {
  const apiKey = request.headers.get('x-api-key');
  
  if (!apiKey) {
    return { error: 'API key is required', status: 401 };
  }
  
  // Get valid API keys from environment variables
  const validApiKeys = process.env.API_KEYS?.split(',').map(key => key.trim()) || [];
  
  // In production or on Vercel, API keys must be configured
  if (validApiKeys.length === 0) {
    // Only allow bypass in local development environment
    // Check explicitly for local development: NODE_ENV must be 'development' AND not running on Vercel
    const isLocalDev = process.env.NODE_ENV === 'development' 
      && !process.env.VERCEL 
      && !process.env.VERCEL_ENV;
    
    if (!isLocalDev) {
      return { error: 'API key configuration missing. Please set API_KEYS environment variable.', status: 500 };
    }
    
    // Local development only: accept any API key with warning
    console.warn('[DEV ONLY] No API_KEYS configured. Accepting any API key for local development.');
    return null;
  }
  
  // Validate against configured API keys
  if (!validApiKeys.includes(apiKey)) {
    return { error: 'Invalid API key', status: 401 };
  }
  
  return null;
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// POST - Create payment
export async function POST(request: NextRequest) {
  // Authenticate
  const authError = authenticateApiKey(request);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status, headers: corsHeaders });
  }

  const body = await request.json() as PaymentRequest;
  const {
    amount,
    currency,
    description,
    customerEmail,
    orderId,
    successUrl,
    webhookUrl
  } = body;

  // Validation
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'Valid amount is required' }, { status: 400, headers: corsHeaders });
  }

  if (!currency || !SUPPORTED_CURRENCIES.includes(currency)) {
    return NextResponse.json({ 
      error: `Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}` 
    }, { status: 400, headers: corsHeaders });
  }

  if (!customerEmail || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(customerEmail)) {
    return NextResponse.json({ error: 'Valid customer email is required' }, { status: 400, headers: corsHeaders });
  }

  if (!orderId) {
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400, headers: corsHeaders });
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
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const paymentUrl = `${protocol}://${host}/payment?paymentId=${paymentId}`;

  return NextResponse.json({
    paymentId,
    paymentUrl,
    amount,
    currency,
    fee,
    totalAmount: payment.totalAmount,
    status: 'pending'
  }, { status: 201, headers: corsHeaders });
}

// GET - Get payment status
export async function GET(request: NextRequest) {
  // Authenticate
  const authError = authenticateApiKey(request);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status, headers: corsHeaders });
  }

  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get('paymentId');

  if (!paymentId) {
    return NextResponse.json({ error: 'Payment ID is required' }, { status: 400, headers: corsHeaders });
  }

  const payment = payments.get(paymentId);

  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404, headers: corsHeaders });
  }

  return NextResponse.json({
    paymentId: payment.paymentId,
    amount: payment.amount,
    currency: payment.currency,
    orderId: payment.orderId,
    status: payment.status,
    fee: payment.fee,
    totalAmount: payment.totalAmount,
    createdAt: payment.createdAt,
    completedAt: payment.completedAt
  }, { headers: corsHeaders });
}
