'use client';

import { CreditCard, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const TestCardInfo = () => {
  return (
    <div className="space-y-4">
      <Alert>
        <CreditCard className="h-4 w-4" />
        <AlertTitle>Test Card Information</AlertTitle>
        <AlertDescription>
          Use these test card numbers in the sandbox environment:
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-2">Successful Payment</h3>
          <p className="text-sm text-muted-foreground">
            Card Number: 4242 4242 4242 4242
            <br />
            Expiry: Any future date
            <br />
            CVC: Any 3 digits
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-2">Payment Requires Authentication</h3>
          <p className="text-sm text-muted-foreground">
            Card Number: 4000 0025 0000 3155
            <br />
            Expiry: Any future date
            <br />
            CVC: Any 3 digits
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-2">Payment Declined</h3>
          <p className="text-sm text-muted-foreground">
            Card Number: 4000 0000 0000 0002
            <br />
            Expiry: Any future date
            <br />
            CVC: Any 3 digits
          </p>
        </div>
      </div>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          These cards only work in test mode. Never use real card numbers in the sandbox environment.
        </AlertDescription>
      </Alert>
    </div>
  );
};
