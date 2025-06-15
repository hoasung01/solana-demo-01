'use client';

import { PaymentForm } from '@/components/PaymentForm';
import { TestCardInfo } from '@/components/TestCardInfo';

export default function PaymentPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold text-center mb-8">Payment</h1>
      <div className="max-w-md mx-auto bg-card rounded-lg shadow-sm p-6">
        <PaymentForm />
      </div>
      {process.env.NODE_ENV === 'development' && <TestCardInfo />}
    </div>
  );
}
