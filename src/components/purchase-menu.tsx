'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StripeElementsProvider } from '@/components/stripe-elements-provider';
import { PaymentForm } from '@/components/payment-form';
import { useWallet } from '@solana/wallet-adapter-react';

interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: 'USD' | 'VND';
}

const items: Item[] = [
  {
    id: 'premium-nft',
    name: 'Premium NFT',
    description: 'Exclusive digital collectible with unique features',
    price: 100,
    currency: 'USD',
  },
  {
    id: 'vip-membership',
    name: 'VIP Membership',
    description: 'Access to premium features and exclusive content',
    price: 50,
    currency: 'USD',
  },
  {
    id: 'digital-asset',
    name: 'Digital Asset Pack',
    description: 'Collection of digital assets and resources',
    price: 25,
    currency: 'USD',
  },
];

export function PurchaseMenu() {
  const { connected } = useWallet();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async (item: Item) => {
    try {
      setIsLoading(true);
      setError(null);
      setSelectedItem(item);
      setIsDialogOpen(true);

      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: item.price,
          currency: item.currency,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const data = await response.json();
      if (!data.clientSecret) {
        throw new Error('No client secret received from server');
      }
      setClientSecret(data.clientSecret);
    } catch (err) {
      console.error('Error creating payment intent:', err);
      setError(err instanceof Error ? err.message : 'Failed to create payment intent');
      setIsDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="text-center py-8">
        <p className="text-lg">Please connect your wallet to make a purchase</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Available Items</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {item.currency === 'USD' ? '$' : '₫'}{item.price}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handlePurchase(item)}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Processing...' : 'Purchase'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Complete Purchase
            </DialogTitle>
          </DialogHeader>
          {error ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
              {error}
            </div>
          ) : clientSecret ? (
            <StripeElementsProvider clientSecret={clientSecret}>
              <PaymentForm
                amount={selectedItem?.price || 0}
                currency={selectedItem?.currency || 'USD'}
                onSuccess={() => {
                  setIsDialogOpen(false);
                  setClientSecret(null);
                }}
                onError={(error) => {
                  setError(error);
                }}
              />
            </StripeElementsProvider>
          ) : (
            <div className="p-4 text-center">
              <p>Preparing payment form...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
