'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { Card } from '@/components/ui/card';
import { CreditLimit } from '@/components/bnpl/credit-limit';
import { StakeManager } from '@/components/solana/stake-manager';
import { TransactionHistory } from '@/components/bnpl/transaction-history';

export default function DashboardPage() {
  const { connected } = useWallet();

  if (!connected) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Welcome to Solana BNPL</h1>
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            Connect your wallet to get started
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <CreditLimit />
        <StakeManager />
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        <TransactionHistory />
      </div>
    </div>
  );
}
