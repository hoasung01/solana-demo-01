'use client';

import { WalletConnect } from '@/components/solana/wallet-connect';
import { CardList } from '@/components/credit-card/card-list';
import { BNPLTransactionForm } from '@/components/bnpl/transaction-form';
import { TransactionHistory } from '@/components/bnpl/transaction-history';
import { CreditLimit } from '@/components/bnpl/credit-limit';
import { StakeManager } from '@/components/solana/stake-manager';

export default function BNPLPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <WalletConnect />
          <StakeManager />
          <CreditLimit />
        </div>
        <div className="space-y-8">
          <CardList />
          <BNPLTransactionForm />
        </div>
      </div>

      <TransactionHistory />
    </div>
  );
}
