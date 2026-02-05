# Payment Gateway Integration

Payment gateway integration deployed on Vercel with **Next.js** and serverless functions written in **TypeScript**.

## 🚀 Features

- **Next.js** - Modern React framework with server-side rendering
- **TypeScript** - Type-safe code for better developer experience
- **Serverless API** - TypeScript serverless functions
- **Responsive Design** - Mobile-friendly payment UI
- **3D Secure** - Mock 3D Secure verification flow

## 🚀 Deployment

This project is configured for deployment on Vercel:

```bash
# Install dependencies
npm install

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables (recommended for production)
vercel env add API_KEYS
```

Or simply push to GitHub and connect to Vercel for automatic deployments.

## 🔧 Development

```bash
# Install dependencies
npm install

# Run Next.js development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run type checking
npm run type-check
```

Visit http://localhost:3000 to see the application.

## 🔐 Environment Variables

Create a `.env` file for local development (copy from `.env.example`):

```bash
cp .env.example .env
```

**Required Environment Variables:**

- `API_KEYS` - Comma-separated list of valid API keys (e.g., `key1,key2,key3`)
  
**Optional Environment Variables:**

- `NODE_ENV` - Set to 'production' for production environment (Vercel sets this automatically)

**Note:** If `API_KEYS` is not set in development, the API will accept any API key with a warning. In production, missing `API_KEYS` will result in an error.

## 📚 Quick Start Guide

### 1. Create a Payment

**Endpoint:** `POST /api/payment-gateway/payments`

**Headers:**
```
X-API-Key: your_api_key_here
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 100,
  "currency": "USD",
  "description": "Order #12345",
  "customerEmail": "customer@example.com",
  "orderId": "12345",
  "successUrl": "https://yoursite.com/success",
  "webhookUrl": "https://yoursite.com/webhook"
}
```

**Response:**
```json
{
  "paymentId": "uuid",
  "paymentUrl": "https://your-domain.vercel.app/payment.html?paymentId=uuid",
  "amount": 100,
  "currency": "USD",
  "fee": 2.5,
  "totalAmount": 102.5,
  "status": "pending"
}
```

### 2. Redirect Customer

Redirect your customer to the `paymentUrl` returned in the response.

### 3. Handle Webhook

Receive payment confirmation via webhook when the payment is completed:

```json
{
  "event": "payment.completed",
  "paymentId": "uuid",
  "amount": 100,
  "currency": "USD",
  "orderId": "12345",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 4. Check Payment Status

**Endpoint:** `GET /api/payment-gateway/payments?paymentId=xxx`

**Headers:**
```
X-API-Key: your_api_key_here
```

**Response:**
```json
{
  "paymentId": "uuid",
  "amount": 100,
  "currency": "USD",
  "orderId": "12345",
  "status": "completed",
  "fee": 2.5,
  "totalAmount": 102.5,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "completedAt": "2024-01-01T00:05:00.000Z"
}
```

## Supported Currencies

- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- CHF (Swiss Franc)
- JPY (Japanese Yen)
- CAD (Canadian Dollar)
- AUD (Australian Dollar)

## Transaction Fee

**2.5% per transaction**

The fee is automatically calculated and added to the total amount.

## Example Usage

```bash
# Create a payment
curl -X POST https://your-domain.vercel.app/api/payment-gateway/payments \
  -H "X-API-Key: test_key_123" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "USD",
    "description": "Order #12345",
    "customerEmail": "customer@example.com",
    "orderId": "12345",
    "successUrl": "https://your-domain.vercel.app/",
    "webhookUrl": "https://your-domain.vercel.app/webhook"
  }'

# Check payment status
curl -X GET "https://your-domain.vercel.app/api/payment-gateway/payments?paymentId=YOUR_PAYMENT_ID" \
  -H "X-API-Key: test_key_123"
```

## API Endpoints

- `POST /api/payment-gateway/payments` - Create a new payment
- `GET /api/payment-gateway/payments?paymentId=xxx` - Get payment status
- `GET /api/payment-info?paymentId=xxx` - Get public payment info (no auth required)
- `POST /api/complete-payment?paymentId=xxx` - Complete payment (internal use)

## Pages

- `/` - Demo payment UI (Next.js page)
- `/payment` - Payment checkout page (Next.js page with query parameter: ?paymentId=xxx)

Legacy HTML files are still available:
- `/index.html` - Static demo payment UI
- `/payment.html` - Static payment checkout page

## Notes

- **Built with Next.js and TypeScript** for modern React development with type safety
- This is a demo implementation using in-memory storage
- In production, use Vercel KV, Redis, or a database for persistent storage
- Implement proper API key validation and storage
- Use HTTPS for all communication (Vercel provides this automatically)
- Implement proper webhook signature verification
- Add rate limiting and security measures
- All API endpoints are serverless functions deployed on Vercel
- Next.js pages are automatically optimized and deployed alongside API routes

