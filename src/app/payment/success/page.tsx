'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const paymentIntent = searchParams.get('payment_intent');
    const redirectStatus = searchParams.get('redirect_status');

    if (redirectStatus === 'succeeded') {
      setStatus('success');
      setMessage('Your payment was successful! Thank you for your purchase.');
    } else {
      setStatus('error');
      setMessage('There was an issue with your payment. Please try again.');
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'loading' && 'Processing Payment...'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'error' && 'Payment Error'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {message}
          </p>
          <div className="flex justify-center">
            <Button asChild>
              <Link href="/payment">
                Return to Payment Page
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
