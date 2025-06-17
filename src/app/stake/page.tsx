'use client';

import { useDevnetStaking } from '@/hooks/use-devnet-staking';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export default function StakePage() {
  const { publicKey } = useWallet();
  const { solBalance, mSolBalance, stakingStats, stakeSol, unstakeSol, isStaking, isUnstaking } = useDevnetStaking();
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [isStakingPending, setIsStakingPending] = useState(false);

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold">Connect your wallet to start staking</h2>
        <WalletMultiButton />
      </div>
    );
  }

  const handleStake = async () => {
    setIsStakingPending(true);
    try {
      await stakeSol(Number(stakeAmount));
    } catch (error) {
      console.error('Error staking:', error);
    } finally {
      setIsStakingPending(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Staking Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Staking Stats</CardTitle>
            <CardDescription>
              {stakingStats?.hasStaked
                ? 'Your current staking statistics'
                : 'Stake SOL to start earning rewards'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current APY</span>
                <span className="text-sm font-medium">
                  {stakingStats?.apyData?.current ? `${stakingStats.apyData.current}%` : '0%'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">7-Day APY</span>
                <span className="text-sm font-medium">
                  {stakingStats?.apyData?.["7d"] ? `${stakingStats.apyData["7d"]}%` : '0%'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">30-Day APY</span>
                <span className="text-sm font-medium">
                  {stakingStats?.apyData?.["30d"] ? `${stakingStats.apyData["30d"]}%` : '0%'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">90-Day APY</span>
                <span className="text-sm font-medium">
                  {stakingStats?.apyData?.["90d"] ? `${stakingStats.apyData["90d"]}%` : '0%'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Rewards</span>
                <span className="text-sm font-medium">
                  {stakingStats?.hasStaked ? `${stakingStats.totalRewards} SOL` : '0 SOL'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Staking Duration</span>
                <span className="text-sm font-medium">
                  {stakingStats?.hasStaked ? stakingStats.stakingDuration : 'Not staked yet'}
                </span>
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
              <div className="space-y-2">
                <Label htmlFor="stake-amount">Amount to Stake</Label>
                <Input
                  id="stake-amount"
                  type="number"
                  placeholder="Enter SOL amount"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  min="0"
                  step="0.1"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleStake}
                disabled={!stakeAmount || isStakingPending}
              >
                {isStakingPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Staking...
                  </div>
                ) : (
                  "Stake SOL (Powered by Marinade Finance)"
                )}
              </Button>
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
