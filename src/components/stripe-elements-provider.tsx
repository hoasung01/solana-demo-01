'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '@/lib/stripe-client-config';

// Initialize Stripe
const stripePromise = STRIPE_PUBLISHABLE_KEY
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null;

interface StripeElementsProviderProps {
  children: React.ReactNode;
  clientSecret: string;
}

export function StripeElementsProvider({
  children,
  clientSecret,
}: StripeElementsProviderProps) {
  if (!stripePromise) {
    return (
      <div className="p-4 text-center text-destructive">
        Stripe is not properly configured. Please check your environment variables.
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0F172A',
        colorBackground: '#ffffff',
        colorText: '#0F172A',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '4px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
