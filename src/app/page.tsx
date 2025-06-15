'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useDevnetStaking } from '@/hooks/use-devnet-staking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import dynamic from 'next/dynamic';

const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export default function DashboardPage() {
  const { publicKey } = useWallet();
  const { solBalance, mSolBalance } = useDevnetStaking();

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold">Connect your wallet to view your dashboard</h2>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Value</span>
                <span className="font-medium">
                  {((solBalance || 0) + (mSolBalance || 0)).toFixed(4)} SOL
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest staking activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">No recent transactions</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
