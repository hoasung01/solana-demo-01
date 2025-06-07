'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { Card } from '@/components/ui/card';
import { StakeManager } from '@/components/solana/stake-manager';
import { CreditLimit } from '@/components/bnpl/credit-limit';

export default function StakingPage() {
  const { connected } = useWallet();

  if (!connected) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Staking</h1>
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            Connect your wallet to manage stakes
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Staking</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <StakeManager />
        <CreditLimit />
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">How Staking Works</h2>
        <div className="prose prose-sm">
          <p>
            Staking your SOL tokens allows you to:
          </p>
          <ul>
            <li>Earn a credit limit for BNPL transactions</li>
            <li>Get access to exclusive features</li>
            <li>Participate in the ecosystem</li>
          </ul>
          <p>
            Your credit limit is calculated as 30% of your total staked amount.
            For example, if you stake 100 SOL, you&apos;ll get a credit limit of 30 SOL.
          </p>
        </div>
      </Card>
    </div>
  );
}
