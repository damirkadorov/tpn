import { NextRequest, NextResponse } from 'next/server';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Webhook-Signature',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    // Log webhook for demo purposes
    console.log('Webhook received:', JSON.stringify(payload, null, 2));
    
    // In production, you would:
    // 1. Verify webhook signature
    // 2. Process the payment completion
    // 3. Update your database
    // 4. Send confirmation email to customer
    
    return NextResponse.json({
      success: true,
      message: 'Webhook received',
      receivedEvent: payload.event,
      paymentId: payload.paymentId
    }, { headers: corsHeaders });
  } catch {
    return NextResponse.json({
      success: false,
      error: 'Invalid webhook payload'
    }, { status: 400, headers: corsHeaders });
  }
}
