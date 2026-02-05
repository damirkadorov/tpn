# Vercel Deployment Guide

## Quick Deploy to Vercel

### Option 1: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Option 2: Using GitHub Integration

1. Push this repository to GitHub
2. Visit [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will automatically detect the configuration and deploy

## Testing Locally

```bash
# Install dependencies
npm install

# Run Vercel dev server locally
vercel dev

# Or use npx
npx vercel dev
```

The local server will start on http://localhost:3000

## Environment Variables (Optional)

For production, you can add environment variables in Vercel Dashboard:

- `API_KEY_SECRET` - Secret for validating API keys
- `WEBHOOK_SECRET` - Secret for signing webhooks

## Project Structure

```
.
├── api/
│   ├── payment-gateway/
│   │   └── payments.js          # POST/GET /api/payment-gateway/payments
│   ├── payment-info.js           # GET /api/payment-info
│   └── complete-payment.js       # POST /api/complete-payment
├── index.html                    # Demo payment UI
├── payment.html                  # Payment checkout page
├── vercel.json                   # Vercel configuration
├── package.json                  # Dependencies
└── README.md                     # Documentation
```

## API Endpoints

Once deployed, your API will be available at:

- `https://your-project.vercel.app/api/payment-gateway/payments` (POST/GET)
- `https://your-project.vercel.app/api/payment-info` (GET)
- `https://your-project.vercel.app/api/complete-payment` (POST)

## Testing Your Deployment

```bash
# Replace YOUR_DOMAIN with your actual Vercel domain
export API_BASE="https://your-project.vercel.app"

# Create a payment
curl -X POST $API_BASE/api/payment-gateway/payments \
  -H "X-API-Key: test_key_123" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "USD",
    "description": "Test Order",
    "customerEmail": "test@example.com",
    "orderId": "TEST-001",
    "successUrl": "'$API_BASE'/",
    "webhookUrl": "'$API_BASE'/webhook"
  }'

# Get payment status (use paymentId from above response)
curl -X GET "$API_BASE/api/payment-gateway/payments?paymentId=YOUR_PAYMENT_ID" \
  -H "X-API-Key: test_key_123"
```

## Notes

- Vercel serverless functions have a 10-second timeout limit
- In-memory storage (global.payments) will persist during the function's lifetime but may reset
- For production, consider using [Vercel KV](https://vercel.com/docs/storage/vercel-kv) or a database
- HTTPS is automatically provided by Vercel
