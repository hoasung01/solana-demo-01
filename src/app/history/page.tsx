'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { Card } from '@/components/ui/card';
import { TransactionHistory } from '@/components/bnpl/transaction-history';

export default function HistoryPage() {
  const { connected } = useWallet();

  if (!connected) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            Connect your wallet to view transaction history
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Transaction History</h1>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        <TransactionHistory />
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Transaction Types</h2>
        <div className="prose prose-sm">
          <p>
            Your transaction history includes:
          </p>
          <ul>
            <li>Staking transactions</li>
            <li>Unstaking transactions</li>
            <li>BNPL transactions</li>
            <li>Credit card linking/unlinking</li>
          </ul>
          <p>
            Each transaction shows the type, amount, status, and timestamp.
            You can use this history to track your activity and manage your account.
          </p>
        </div>
      </Card>
    </div>
  );
}
