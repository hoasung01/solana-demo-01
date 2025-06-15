'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Marinade, MarinadeConfig } from '@marinade.finance/marinade-ts-sdk';
import { toast } from 'sonner';

export const useMarinadeStaking = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const queryClient = useQueryClient();

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

  // Mutation to stake SOL and get mSOL
  const stakeMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!publicKey || !marinade.data) throw new Error('Wallet not connected');

      const { transaction, associatedMSolTokenAccountAddress } = await marinade.data.deposit(amount);

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);

      toast.success(`Successfully staked ${amount} SOL and received mSOL`);
      return signature;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mSolBalance'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to stake SOL');
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
    stake: stakeMutation.mutate,
    isStaking: stakeMutation.isPending,
    unstake: unstakeMutation.mutate,
    isUnstaking: unstakeMutation.isPending,
  };
};
