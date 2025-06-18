import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Exchange rates for development
export const EXCHANGE_RATES = {
  USD_TO_MSOL: Number(process.env.NEXT_PUBLIC_USD_TO_MSOL_RATE) || 0.05,
  VND_TO_MSOL: Number(process.env.NEXT_PUBLIC_VND_TO_MSOL_RATE) || 0.000002,
};
