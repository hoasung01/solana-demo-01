'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentForm } from '@/components/PaymentForm';
import { TestCardInfo } from '@/components/TestCardInfo';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PaymentPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Purchase and Stake SOL</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Elements stripe={stripePromise}>
            <PaymentForm />
          </Elements>
        </div>
        <div>
          <TestCardInfo />
        </div>
      </div>
    </div>
  );
}
