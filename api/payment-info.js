// Get payment info (public endpoint for payment page)
const payments = global.payments || (global.payments = new Map());

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentId } = req.query;

  if (!paymentId) {
    return res.status(400).json({ error: 'Payment ID is required' });
  }

  const payment = payments.get(paymentId);

  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  // Return only necessary info for the payment page
  return res.json({
    paymentId: payment.paymentId,
    amount: payment.amount,
    currency: payment.currency,
    description: payment.description,
    fee: payment.fee,
    totalAmount: payment.totalAmount,
    status: payment.status
  });
};
