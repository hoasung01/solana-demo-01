'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useStripePayment } from './use-stripe-payment';

// SOL price in USD (this should be fetched from an API in production)
const SOL_PRICE_USD = 100; // Example price

export const useSolPurchase = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { handlePayment } = useStripePayment();

  const purchaseMutation = useMutation({
    mutationFn: async ({ amount, paymentMethod }: { amount: number; paymentMethod: any }) => {
      if (!publicKey) throw new Error('Wallet not connected');

      // Calculate USD amount
      const usdAmount = amount * SOL_PRICE_USD;

      // Process payment
      const paymentSuccess = await handlePayment(usdAmount, paymentMethod);

      if (!paymentSuccess) {
        throw new Error('Payment failed');
      }

      // In a real implementation, you would:
      // 1. Call your backend to process the payment
      // 2. Send SOL to the user's wallet
      // 3. Update the user's balance

      toast.success(`Successfully purchased ${amount} SOL`);
      return paymentSuccess;
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to purchase SOL');
    },
  });

  return {
    purchaseSol: purchaseMutation.mutate,
    isPurchasing: purchaseMutation.isPending,
  };
};
