'use client';

// Client-side Stripe configuration
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_PUBLISHABLE_KEY) {
  console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. Stripe Elements will not work properly.');
}
