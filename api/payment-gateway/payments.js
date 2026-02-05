const { v4: uuidv4 } = require('uuid');

// In-memory storage (in production, use Vercel KV or a database)
// For demo purposes, we'll use a global object that persists during the function's lifetime
const payments = global.payments || (global.payments = new Map());

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD'];
const TRANSACTION_FEE_PERCENT = 2.5;

// Calculate transaction fee
const calculateFee = (amount) => {
  return (amount * TRANSACTION_FEE_PERCENT) / 100;
};

// Authenticate API Key
const authenticateApiKey = (req) => {
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
  if (!validApiKeys.includes(apiKey)) {
    return { error: 'Invalid API key', status: 401 };
  }
  
  return null;
};

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST - Create payment
  if (req.method === 'POST') {
    // Authenticate
    const authError = authenticateApiKey(req);
    if (authError) {
      return res.status(authError.status).json({ error: authError.error });
    }

    const {
      amount,
      currency,
      description,
      customerEmail,
      orderId,
      successUrl,
      webhookUrl
    } = req.body;

    // Validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (!currency || !SUPPORTED_CURRENCIES.includes(currency)) {
      return res.status(400).json({ 
        error: `Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}` 
      });
    }

    if (!customerEmail || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(customerEmail)) {
      return res.status(400).json({ error: 'Valid customer email is required' });
    }

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Create payment
    const paymentId = uuidv4();
    const fee = calculateFee(amount);
    const payment = {
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

    return res.status(201).json({
      paymentId,
      paymentUrl,
      amount,
      currency,
      fee,
      totalAmount: payment.totalAmount,
      status: 'pending'
    });
  }

  // GET - Get payment status
  if (req.method === 'GET') {
    // Authenticate
    const authError = authenticateApiKey(req);
    if (authError) {
      return res.status(authError.status).json({ error: authError.error });
    }

    const { paymentId } = req.query;

    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    const payment = payments.get(paymentId);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    return res.json({
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
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
