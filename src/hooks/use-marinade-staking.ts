'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Marinade, MarinadeConfig } from '@marinade.finance/marinade-ts-sdk';
import { toast } from 'sonner';
import { useSolPurchase } from './use-sol-purchase';
import { MarinadeService } from '@/lib/marinade-service';

export function useMarinadeStaking() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const queryClient = useQueryClient();
  const { purchaseSol, isPurchasing } = useSolPurchase();
  const marinadeService = new MarinadeService(connection);

  // Query for SOL balance
  const { data: solBalance } = useQuery({
    queryKey: ['solBalance', publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return 0;
      const balance = await connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    },
    enabled: !!publicKey,
  });

  // Query for Marinade staking info
  const { data: marinadeState } = useQuery({
    queryKey: ['marinadeState', publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return null;
      return marinadeService.getStakingInfo(publicKey);
    },
    enabled: !!publicKey,
  });

  // Query for recent transactions
  const { data: recentTransactions } = useQuery({
    queryKey: ['recentTransactions', publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return [];
      return marinadeService.getRecentTransactions(publicKey);
    },
    enabled: !!publicKey,
  });

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
      if (!publicKey || !marinade.data) return 0;
      const balance = await marinade.data.getMSolBalance(publicKey);
      return balance;
    },
    enabled: !!publicKey && !!marinade.data,
  });

  // Mutation for staking SOL
  const stakeMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!publicKey) throw new Error('Wallet not connected');
      const instruction = await marinadeService.stakeSol(publicKey, amount);
      const tx = await sendTransaction(instruction, []);
      await connection.confirmTransaction(tx);
      return tx;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solBalance'] });
      queryClient.invalidateQueries({ queryKey: ['marinadeState'] });
      toast.success('Successfully staked SOL');
    },
    onError: (error) => {
      toast.error('Failed to stake SOL: ' + error.message);
    },
  });

  // Mutation for unstaking SOL
  const unstakeMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!publicKey) throw new Error('Wallet not connected');
      const instruction = await marinadeService.unstakeSol(publicKey, amount);
      const tx = await sendTransaction(instruction, []);
      await connection.confirmTransaction(tx);
      return tx;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solBalance'] });
      queryClient.invalidateQueries({ queryKey: ['marinadeState'] });
      toast.success('Successfully unstaked SOL');
    },
    onError: (error) => {
      toast.error('Failed to unstake SOL: ' + error.message);
    },
  });

  return {
    solBalance,
    mSolBalance,
    isLoadingBalance,
    marinadeState: {
      ...marinadeState,
      recentTransactions,
    },
    stake: stakeMutation.mutate,
    isStaking: stakeMutation.isPending,
    unstake: unstakeMutation.mutate,
    isUnstaking: unstakeMutation.isPending,
  };
}
