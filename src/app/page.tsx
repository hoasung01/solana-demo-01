'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useMarinadeStaking } from '@/hooks/use-marinade-staking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { publicKey } = useWallet();
  const { data: marinadeData } = useMarinadeStaking();

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-2xl font-bold">Welcome to Solana Demo</h1>
        <p className="text-muted-foreground">Please connect your wallet to continue</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Button asChild>
            <Link href="/stake">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Stake SOL
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/payment">
              <ArrowDownRight className="mr-2 h-4 w-4" />
              Buy SOL
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>SOL Balance</CardTitle>
            <CardDescription>Your current SOL balance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{marinadeData?.solBalance || 0} SOL</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>mSOL Balance</CardTitle>
            <CardDescription>Your staked SOL in mSOL</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{marinadeData?.msolBalance || 0} mSOL</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Value</CardTitle>
            <CardDescription>Combined value of SOL and mSOL</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {(marinadeData?.solBalance || 0) + (marinadeData?.msolBalance || 0)} SOL
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {marinadeData?.recentTransactions?.map((tx, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tx.type}</p>
                    <p className="text-sm text-muted-foreground">{tx.date}</p>
                  </div>
                  <p className="font-medium">{tx.amount} SOL</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staking Stats</CardTitle>
            <CardDescription>Your staking performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">APY</p>
                <p className="font-medium">{marinadeData?.apy || 0}%</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Total Rewards</p>
                <p className="font-medium">{marinadeData?.totalRewards || 0} SOL</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Staking Duration</p>
                <p className="font-medium">{marinadeData?.stakingDuration || '0 days'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
