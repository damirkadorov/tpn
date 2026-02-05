// Complete payment endpoint
const payments = global.payments || (global.payments = new Map());

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
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

  if (payment.status === 'completed') {
    return res.status(400).json({ error: 'Payment already completed' });
  }

  // Update payment status
  payment.status = 'completed';
  payment.completedAt = new Date().toISOString();
  payments.set(paymentId, payment);

  // Send webhook notification (if webhookUrl provided)
  if (payment.webhookUrl) {
    const webhookPayload = {
      event: 'payment.completed',
      paymentId: payment.paymentId,
      amount: payment.amount,
      currency: payment.currency,
      orderId: payment.orderId,
      timestamp: payment.completedAt
    };
    
    console.log('Webhook would be sent to:', payment.webhookUrl);
    console.log('Webhook payload:', webhookPayload);

    // In production, send actual HTTP request to webhookUrl
    // try {
    //   await fetch(payment.webhookUrl, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(webhookPayload)
    //   });
    // } catch (error) {
    //   console.error('Webhook delivery failed:', error);
    // }
  }

  return res.json({
    success: true,
    paymentId: payment.paymentId,
    status: payment.status,
    redirectUrl: payment.successUrl
  });
};
