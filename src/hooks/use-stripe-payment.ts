'use client';

import { loadStripe } from '@stripe/stripe-js';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentIntentResponse {
  clientSecret: string;
}

export const useStripePayment = () => {
  // Query to create a payment intent
  const createPaymentIntent = useMutation({
    mutationFn: async (amount: number) => {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      return response.json() as Promise<PaymentIntentResponse>;
    },
  });

  // Query to confirm payment
  const confirmPayment = useMutation({
    mutationFn: async ({ clientSecret, paymentMethod }: { clientSecret: string; paymentMethod: any }) => {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to initialize');

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod,
      });

      if (error) {
        throw new Error(error.message);
      }

      return paymentIntent;
    },
  });

  // Function to handle payment submission
  const handlePayment = async (amount: number, paymentMethod: any) => {
    try {
      // Create payment intent
      const { clientSecret } = await createPaymentIntent.mutateAsync(amount);

      // Confirm payment
      const paymentIntent = await confirmPayment.mutateAsync({
        clientSecret,
        paymentMethod,
      });

      if (paymentIntent.status === 'succeeded') {
        toast.success('Payment successful!');
        return true;
      } else {
        toast.error('Payment failed');
        return false;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Payment failed');
      return false;
    }
  };

  return {
    handlePayment,
    isLoading: createPaymentIntent.isPending || confirmPayment.isPending,
    error: createPaymentIntent.error || confirmPayment.error,
  };
};
