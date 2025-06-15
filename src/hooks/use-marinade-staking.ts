'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Marinade, MarinadeConfig } from '@marinade.finance/marinade-ts-sdk';
import { toast } from 'sonner';
import { useSolPurchase } from './use-sol-purchase';

export const useMarinadeStaking = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const queryClient = useQueryClient();
  const { purchaseSol, isPurchasing } = useSolPurchase();

  // Initialize Marinade SDK
  const marinade = useQuery({
    queryKey: ['marinade'],
    queryFn: async () => {
      if (!publicKey) return null;
      const config = new MarinadeConfig({
        connection,
        publicKey,
      });
      return new Marinade(config);
    },
    enabled: !!publicKey,
  });

  // Query to get user's mSOL balance
  const { data: mSolBalance, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['mSolBalance', publicKey?.toString()],
    queryFn: async () => {
      if (!publicKey || !marinade.data) return null;
      const balance = await marinade.data.getMSolBalance(publicKey);
      return balance;
    },
    enabled: !!publicKey && !!marinade.data,
  });

  // Query to get Marinade state
  const { data: marinadeState } = useQuery({
    queryKey: ['marinadeState'],
    queryFn: async () => {
      if (!marinade.data) return null;
      return await marinade.data.getState();
    },
    enabled: !!marinade.data,
  });

  // Mutation to purchase SOL and stake it
  const purchaseAndStakeMutation = useMutation({
    mutationFn: async ({ amount, paymentMethod }: { amount: number; paymentMethod: any }) => {
      if (!publicKey || !marinade.data) throw new Error('Wallet not connected');

      // First, purchase SOL using credit card
      await purchaseSol({ amount, paymentMethod });

      // Then, stake the purchased SOL
      const { transaction, associatedMSolTokenAccountAddress } = await marinade.data.deposit(amount);

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);

      toast.success(`Successfully purchased and staked ${amount} SOL`);
      return signature;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mSolBalance'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to purchase and stake SOL');
    },
  });

  // Mutation to unstake mSOL and get SOL back
  const unstakeMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!publicKey || !marinade.data) throw new Error('Wallet not connected');

      const { transaction } = await marinade.data.liquidUnstake(amount);

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);

      toast.success(`Successfully unstaked ${amount} mSOL and received SOL`);
      return signature;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mSolBalance'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to unstake mSOL');
    },
  });

  return {
    mSolBalance,
    isLoadingBalance,
    marinadeState,
    purchaseAndStake: purchaseAndStakeMutation.mutate,
    isPurchasingAndStaking: purchaseAndStakeMutation.isPending,
    unstake: unstakeMutation.mutate,
    isUnstaking: unstakeMutation.isPending,
  };
};
