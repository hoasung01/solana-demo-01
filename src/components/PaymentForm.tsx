'use client';

import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useMarinadeStaking } from '@/hooks/use-marinade-staking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const PaymentForm = () => {
  const [amount, setAmount] = useState('');
  const stripe = useStripe();
  const elements = useElements();
  const { purchaseAndStake, isPurchasingAndStaking } = useMarinadeStaking();

  if (!stripe || !elements) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">
          Payment processing is currently unavailable. Please try again later.
        </p>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return;
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      console.error('Error creating payment method:', error);
      return;
    }

    await purchaseAndStake({
      amount: parseFloat(amount),
      paymentMethod
    });

    setAmount('');
    cardElement.clear();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (SOL)</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount of SOL to purchase and stake"
          required
          min="0"
          step="0.01"
        />
      </div>

      <div className="space-y-2">
        <Label>Card Details</Label>
        <div className="p-3 border rounded-md">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPurchasingAndStaking}
        className="w-full"
      >
        {isPurchasingAndStaking ? 'Processing...' : 'Purchase and Stake SOL'}
      </Button>
    </form>
  );
};
