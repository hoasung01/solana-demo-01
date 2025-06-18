'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PurchaseMenu } from '@/components/purchase-menu';

export default function PaymentPage() {
  const { publicKey } = useWallet();

  if (!publicKey) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Please connect your wallet to make a payment</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <PurchaseMenu />;
}
