import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    envKeys: Object.keys(process.env).filter(key => key.includes('STRIPE')),
  });
}
