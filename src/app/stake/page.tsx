'use client';

import { useState } from 'react';
import { useDevnetStaking } from '@/hooks/use-devnet-staking';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

export default function StakePage() {
  const { publicKey } = useWallet();
  const {
    solBalance,
    mSolBalance,
    stakingStats,
    isLoadingStats,
    isLoadingBalance,
    stakeSol,
    unstakeSol,
    isStaking,
    isUnstaking,
    connected,
  } = useDevnetStaking();

  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleStake = async () => {
    try {
      setError(null);
      const amount = parseFloat(stakeAmount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }
      if (amount > (solBalance || 0)) {
        setError('Insufficient SOL balance');
        return;
      }
      await stakeSol(amount);
      setStakeAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stake SOL');
    }
  };

  const handleUnstake = async () => {
    try {
      setError(null);
      const amount = parseFloat(unstakeAmount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }
      if (amount > (mSolBalance || 0)) {
        setError('Insufficient mSOL balance');
        return;
      }
      await unstakeSol(amount);
      setUnstakeAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unstake SOL');
    }
  };

  if (!connected) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Please connect your wallet to start staking</CardDescription>
          </CardHeader>
        </Card>
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
            <CardDescription>Your current staking statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current APY</p>
                  <p className="text-2xl font-bold">
                    {isLoadingStats ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      `${stakingStats?.currentApy || '0.00'}%`
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">7-Day APY</p>
                  <p className="text-2xl font-bold">
                    {isLoadingStats ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      `${stakingStats?.apy7d || '0.00'}%`
                    )}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">30-Day APY</p>
                  <p className="text-2xl font-bold">
                    {isLoadingStats ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      `${stakingStats?.apy30d || '0.00'}%`
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">90-Day APY</p>
                  <p className="text-2xl font-bold">
                    {isLoadingStats ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      `${stakingStats?.apy90d || '0.00'}%`
                    )}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Rewards</p>
                  <p className="text-2xl font-bold">
                    {isLoadingStats ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      `${stakingStats?.totalRewards || '0.0000'} SOL`
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Staking Duration</p>
                  <p className="text-2xl font-bold">
                    {isLoadingStats ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      stakingStats?.stakingDuration || 'Not staked yet'
                    )}
                  </p>
                </div>
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
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">SOL Balance</span>
                <span className="text-sm">
                  {solBalance?.toFixed(4) || '0.0000'} SOL
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">mSOL Balance</span>
                <span className="text-sm">
                  {isLoadingBalance ? (
                    <Skeleton className="h-4 w-20" />
                  ) : (
                    `${mSolBalance?.toFixed(4) || '0.0000'} mSOL`
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stake/Unstake Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Stake SOL</CardTitle>
            <CardDescription>Convert your SOL to mSOL to start earning rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="number"
                placeholder="Amount of SOL to stake"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                min="0"
                step="0.1"
              />
              <Button
                onClick={handleStake}
                disabled={!stakeAmount || isStaking}
                className="w-full"
              >
                {isStaking ? 'Staking...' : 'Stake SOL'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unstake SOL</CardTitle>
            <CardDescription>Convert your mSOL back to SOL</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="number"
                placeholder="Amount of mSOL to unstake"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
                min="0"
                step="0.1"
              />
              <Button
                onClick={handleUnstake}
                disabled={!unstakeAmount || isUnstaking}
                className="w-full"
              >
                {isUnstaking ? 'Unstaking...' : 'Unstake SOL'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            About Marinade Finance
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Marinade Finance is a liquid staking protocol on Solana</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>
            Learn more about liquid staking with Marinade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert">
            <p>
              Marinade Finance is a liquid staking protocol that allows you to stake your SOL and receive mSOL tokens in return.
              These mSOL tokens represent your staked SOL position and earn staking rewards automatically.
            </p>
            <p>
              Benefits of staking with Marinade:
            </p>
            <ul>
              <li>Earn staking rewards automatically</li>
              <li>Use mSOL in DeFi protocols</li>
              <li>Unstake at any time</li>
              <li>No minimum stake amount</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
