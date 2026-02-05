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

## Environment Variables (Required for Production)

### Setting Up API Keys

1. **For Local Development:**

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and add your API keys
nano .env
```

Example `.env` file:
```env
API_KEYS=demo_api_key_123,prod_api_key_456,test_api_key_789
WEBHOOK_SECRET=your_webhook_secret_here
```

2. **For Vercel Deployment:**

Via Vercel Dashboard:
1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Environment Variables
3. Add `API_KEYS` with value: `key1,key2,key3`
4. Select environments: Production, Preview, Development
5. Save

Via Vercel CLI:
```bash
# Add API_KEYS for all environments
vercel env add API_KEYS

# Or add for specific environment
vercel env add API_KEYS production
```

3. **Testing with Environment Variables:**

```bash
# Set environment variable and run locally
API_KEYS=test_key_123 vercel dev

# Or add to .env file and run
vercel dev
```

### Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `API_KEYS` | Comma-separated list of valid API keys | Yes | `key1,key2,key3` |
| `NODE_ENV` | Environment mode (set by Vercel) | No | `production` |
| `VERCEL_ENV` | Vercel environment (set by Vercel) | No | `production` |

**Security Notes:**
- Never commit `.env` file to Git (already in `.gitignore`)
- Use strong, random API keys in production
- Rotate API keys periodically
- In production, missing `API_KEYS` will cause authentication to fail
- In development, missing `API_KEYS` will show a warning but allow any key

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
