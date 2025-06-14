import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MARINADE_STATE_ADDRESS, MSOL_MINT } from '@/lib/constants';
import { getMarinadeState } from '@/lib/marinade';

export const useMarinadeStaking = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const queryClient = useQueryClient();

  // Query to get user's mSOL balance
  const { data: mSolBalance, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['mSolBalance', publicKey?.toString()],
    queryFn: async () => {
      if (!publicKey) return null;
      const balance = await connection.getTokenAccountBalance(
        new PublicKey(MSOL_MINT)
      );
      return balance.value.uiAmount;
    },
    enabled: !!publicKey,
  });

  // Query to get Marinade state
  const { data: marinadeState } = useQuery({
    queryKey: ['marinadeState'],
    queryFn: async () => {
      const state = await getMarinadeState(connection, new PublicKey(MARINADE_STATE_ADDRESS));
      return state;
    },
  });

  // Mutation to stake SOL and get mSOL
  const stakeMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!publicKey) throw new Error('Wallet not connected');

      const transaction = new Transaction();
      // Add Marinade stake instruction here
      // This will be implemented based on Marinade's SDK

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);

      return signature;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mSolBalance'] });
    },
  });

  return {
    mSolBalance,
    isLoadingBalance,
    marinadeState,
    stake: stakeMutation.mutate,
    isStaking: stakeMutation.isPending,
  };
};
