'use client';

import { useDevnetStaking } from '@/hooks/use-devnet-staking';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export default function StakePage() {
  const { publicKey } = useWallet();
  const { solBalance, mSolBalance, stakingStats, stakeSol, unstakeSol, isStaking, isUnstaking } = useDevnetStaking();
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold">Connect your wallet to start staking</h2>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Staking Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Staking Stats</CardTitle>
            <CardDescription>Your current staking performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">APY</span>
                <span className="font-medium">{stakingStats?.apy || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Rewards</span>
                <span className="font-medium">{stakingStats?.totalRewards || 0} SOL</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Staking Duration</span>
                <span className="font-medium">{stakingStats?.stakingDuration || '0 days'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balances */}
        <Card>
          <CardHeader>
            <CardTitle>Your Balances</CardTitle>
            <CardDescription>Current SOL and mSOL balances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">SOL Balance</span>
                <span className="font-medium">{solBalance?.toFixed(4) || 0} SOL</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">mSOL Balance</span>
                <span className="font-medium">{mSolBalance?.toFixed(4) || 0} mSOL</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Stake SOL */}
        <Card>
          <CardHeader>
            <CardTitle>Stake SOL</CardTitle>
            <CardDescription>Convert your SOL to mSOL to earn rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Input
                  type="number"
                  placeholder="Amount in SOL"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  min="0"
                  step="0.1"
                />
                <Button
                  onClick={() => stakeSol(Number(stakeAmount))}
                  disabled={isStaking || !stakeAmount || Number(stakeAmount) <= 0}
                >
                  {isStaking ? 'Staking...' : 'Stake'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unstake SOL */}
        <Card>
          <CardHeader>
            <CardTitle>Unstake SOL</CardTitle>
            <CardDescription>Convert your mSOL back to SOL</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Input
                  type="number"
                  placeholder="Amount in mSOL"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  min="0"
                  step="0.1"
                />
                <Button
                  onClick={() => unstakeSol(Number(unstakeAmount))}
                  disabled={isUnstaking || !unstakeAmount || Number(unstakeAmount) <= 0}
                >
                  {isUnstaking ? 'Unstaking...' : 'Unstake'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
