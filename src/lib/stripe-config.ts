// This file should only be imported in server components or API routes
if (typeof window !== 'undefined') {
  throw new Error('This module should only be used on the server side');
}

// Log all environment variables that start with STRIPE (for debugging)
const stripeEnvVars = Object.entries(process.env)
  .filter(([key]) => key.startsWith('STRIPE'))
  .map(([key, value]) => `${key}=${value ? '***' : 'undefined'}`);

console.log('Available Stripe environment variables:', stripeEnvVars);

// Server-side Stripe configuration
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is missing. Please check your .env.local file');
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

// Make publishable key optional since we only need it for client-side components
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
