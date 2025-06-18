'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePayment } from '@/hooks/use-payment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PaymentFormProps {
  amount: number;
  currency: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function PaymentForm({ amount, currency, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { processPayment } = usePayment();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
      });

      if (error) {
        setError(error.message || 'An error occurred during payment');
        onError(error.message || 'An error occurred during payment');
      } else {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter Card Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">Test Card Numbers</h3>
              <ul className="text-sm space-y-1">
                <li>• 4242 4242 4242 4242 (Successful payment)</li>
                <li>• 4000 0000 0000 0002 (Failed payment)</li>
              </ul>
              <p className="text-sm mt-2">
                Use any future expiration date, any 3-digit CVC, and any postal code.
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <PaymentElement />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={!stripe || !elements || isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Processing...' : `Pay ${currency === 'USD' ? '$' : '₫'}${amount}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
