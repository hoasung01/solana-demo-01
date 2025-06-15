import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DevnetStakingService } from '@/lib/devnet-staking-service';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { toast } from 'sonner';

export function useDevnetStaking() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();
  const stakingService = new DevnetStakingService(connection);

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

  // Query for mSOL balance
  const { data: mSolBalance } = useQuery({
    queryKey: ['mSolBalance', publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return 0;
      try {
        const info = await stakingService.getStakingInfo(publicKey);
        return info.mSolBalance;
      } catch (error) {
        console.error('Error fetching mSOL balance:', error);
        return 0;
      }
    },
    enabled: !!publicKey,
  });

  // Query for staking stats
  const { data: stakingStats } = useQuery({
    queryKey: ['stakingStats', publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return null;
      try {
        const info = await stakingService.getStakingInfo(publicKey);
        return {
          apy: 5.2, // Fixed APY for demo
          totalRewards: (info.mSolBalance * 0.052).toFixed(4), // 5.2% of mSOL balance
          stakingDuration: '0 days', // You can implement duration tracking
        };
      } catch (error) {
        console.error('Error fetching staking stats:', error);
        return null;
      }
    },
    enabled: !!publicKey,
  });

  // Mutation for staking SOL
  const { mutate: stakeSol, isPending: isStaking } = useMutation({
    mutationFn: async (amount: number) => {
      if (!publicKey) throw new Error('Wallet not connected');
      return stakingService.stakeSol(publicKey, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solBalance'] });
      queryClient.invalidateQueries({ queryKey: ['mSolBalance'] });
      queryClient.invalidateQueries({ queryKey: ['stakingStats'] });
      toast.success('Successfully staked SOL');
    },
    onError: (error) => {
      toast.error(`Failed to stake SOL: ${error.message}`);
    },
  });

  // Mutation for unstaking SOL
  const { mutate: unstakeSol, isPending: isUnstaking } = useMutation({
    mutationFn: async (amount: number) => {
      if (!publicKey) throw new Error('Wallet not connected');
      return stakingService.unstakeSol(publicKey, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solBalance'] });
      queryClient.invalidateQueries({ queryKey: ['mSolBalance'] });
      queryClient.invalidateQueries({ queryKey: ['stakingStats'] });
      toast.success('Successfully unstaked SOL');
    },
    onError: (error) => {
      toast.error(`Failed to unstake SOL: ${error.message}`);
    },
  });

  return {
    solBalance,
    mSolBalance,
    stakingStats,
    stakeSol,
    unstakeSol,
    isStaking,
    isUnstaking,
  };
}
