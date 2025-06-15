'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useMarinadeStaking } from '@/hooks/use-marinade-staking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StakePage() {
  const { publicKey } = useWallet();
  const { purchaseAndStake, unstake, isPurchasingAndStaking, isUnstaking, data: marinadeData } = useMarinadeStaking();
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-2xl font-bold">Stake SOL</h1>
        <p className="text-muted-foreground">Please connect your wallet to continue</p>
      </div>
    );
  }

  const handleStake = async () => {
    if (!stakeAmount) return;
    await purchaseAndStake({ amount: parseFloat(stakeAmount) });
    setStakeAmount('');
  };

  const handleUnstake = async () => {
    if (!unstakeAmount) return;
    await unstake({ amount: parseFloat(unstakeAmount) });
    setUnstakeAmount('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Stake SOL</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stake SOL</CardTitle>
            <CardDescription>Stake your SOL to earn rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stake-amount">Amount to Stake</Label>
                <Input
                  id="stake-amount"
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="Enter amount of SOL"
                  min="0"
                  step="0.01"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleStake}
                disabled={isPurchasingAndStaking || !stakeAmount}
              >
                {isPurchasingAndStaking ? (
                  'Processing...'
                ) : (
                  <>
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Stake SOL
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unstake mSOL</CardTitle>
            <CardDescription>Convert your mSOL back to SOL</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="unstake-amount">Amount to Unstake</Label>
                <Input
                  id="unstake-amount"
                  type="number"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  placeholder="Enter amount of mSOL"
                  min="0"
                  step="0.01"
                />
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleUnstake}
                disabled={isUnstaking || !unstakeAmount}
              >
                {isUnstaking ? (
                  'Processing...'
                ) : (
                  <>
                    <ArrowDownRight className="mr-2 h-4 w-4" />
                    Unstake mSOL
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Staking Info</CardTitle>
            <CardDescription>Current staking statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Current APY</p>
                <p className="font-medium">{marinadeData?.apy || 0}%</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Total Staked</p>
                <p className="font-medium">{marinadeData?.totalStaked || 0} SOL</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Your Stake</p>
                <p className="font-medium">{marinadeData?.msolBalance || 0} mSOL</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rewards</CardTitle>
            <CardDescription>Your staking rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Total Rewards</p>
                <p className="font-medium">{marinadeData?.totalRewards || 0} SOL</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Daily Rewards</p>
                <p className="font-medium">{marinadeData?.dailyRewards || 0} SOL</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Next Reward</p>
                <p className="font-medium">{marinadeData?.nextReward || '0 days'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
