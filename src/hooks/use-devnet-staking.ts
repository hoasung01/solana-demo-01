import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PublicKey } from '@solana/web3.js';
import { MarinadeService } from '@/lib/marinade-service';
import { toast } from 'sonner';

export function useDevnetStaking() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const queryClient = useQueryClient();
  const marinadeService = new MarinadeService(connection);

  // Query for SOL balance
  const { data: solBalance } = useQuery({
    queryKey: ['solBalance', wallet.publicKey?.toBase58()],
    queryFn: async () => {
      if (!wallet.publicKey) return 0;
      const balance = await connection.getBalance(wallet.publicKey);
      return balance / 1e9; // Convert lamports to SOL
    },
    enabled: !!wallet.publicKey && wallet.connected,
  });

  // Get staking stats
  const { data: stakingStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["stakingStats", wallet.publicKey?.toBase58()],
    queryFn: async () => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");
      return marinadeService.getStakingStats({
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
        sendTransaction: wallet.sendTransaction
      });
    },
    enabled: !!wallet.publicKey && wallet.connected,
  });

  // Get mSOL balance
  const { data: mSolBalance, isLoading: isLoadingBalance } = useQuery({
    queryKey: ["mSolBalance", wallet.publicKey?.toBase58()],
    queryFn: async () => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");
      return marinadeService.getMSolBalance({
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
        sendTransaction: wallet.sendTransaction
      });
    },
    enabled: !!wallet.publicKey && wallet.connected,
  });

  // Stake SOL
  const { mutate: stakeSol, isLoading: isStaking } = useMutation({
    mutationFn: async (amount: number) => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");
      if (!wallet.signTransaction) throw new Error("Wallet does not support signing transactions");

      console.log("Staking SOL with wallet:", {
        publicKey: wallet.publicKey.toBase58(),
        signTransaction: !!wallet.signTransaction,
        signAllTransactions: !!wallet.signAllTransactions,
        sendTransaction: !!wallet.sendTransaction
      });

      return marinadeService.stakeSol({
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
        sendTransaction: wallet.sendTransaction
      }, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakingStats"] });
      queryClient.invalidateQueries({ queryKey: ["mSolBalance"] });
      toast.success("Successfully staked SOL");
    },
    onError: (error) => {
      toast.error(`Failed to stake SOL: ${error.message}`);
    },
  });

  // Unstake SOL
  const { mutate: unstakeSol, isLoading: isUnstaking } = useMutation({
    mutationFn: async (amount: number) => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");
      if (!wallet.signTransaction) throw new Error("Wallet does not support signing transactions");

      console.log("Unstaking SOL with wallet:", {
        publicKey: wallet.publicKey.toBase58(),
        signTransaction: !!wallet.signTransaction,
        signAllTransactions: !!wallet.signAllTransactions,
        sendTransaction: !!wallet.sendTransaction
      });

      return marinadeService.unstakeSol({
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
        sendTransaction: wallet.sendTransaction
      }, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakingStats"] });
      queryClient.invalidateQueries({ queryKey: ["mSolBalance"] });
      toast.success("Successfully unstaked SOL");
    },
    onError: (error) => {
      toast.error(`Failed to unstake SOL: ${error.message}`);
    },
  });

  return {
    solBalance,
    mSolBalance,
    stakingStats,
    isLoadingStats,
    isLoadingBalance,
    stakeSol,
    unstakeSol,
    isStaking,
    isUnstaking,
    connected: wallet.connected,
  };
}
