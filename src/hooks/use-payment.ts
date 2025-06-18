import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';
import { PaymentService } from '@/lib/payment-service';

export function usePayment() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const paymentService = new PaymentService(connection);

  const { mutate: processPayment, isLoading: isProcessing } = useMutation({
    mutationFn: async ({
      amount,
      currency,
    }: {
      amount: number;
      currency: 'USD' | 'VND';
    }) => {
      if (!wallet.publicKey) throw new Error('Wallet not connected');
      if (!wallet.signTransaction) throw new Error('Wallet does not support signing transactions');

      return paymentService.processPayment(
        amount,
        currency,
        wallet.publicKey,
        {
          publicKey: wallet.publicKey,
          signTransaction: wallet.signTransaction,
          signAllTransactions: wallet.signAllTransactions,
          sendTransaction: wallet.sendTransaction,
        }
      );
    },
  });

  return {
    processPayment,
    isProcessing,
    connected: wallet.connected,
  };
}
