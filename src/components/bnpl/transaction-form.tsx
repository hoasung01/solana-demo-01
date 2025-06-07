'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useStakePool } from '@/hooks/use-stake-pool';
import { toast } from 'sonner';
import { MIN_STAKE_AMOUNT } from '@/lib/constants';
import { BN } from '@/lib/constants';

export function BNPLTransactionForm() {
  const { publicKey, connected } = useWallet();
  const { processBNPLTransaction, getStakeInfo } = useStakePool();
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!connected || !publicKey) {
        throw new Error('Please connect your wallet');
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Please enter a valid amount');
      }

      // Check if user has enough credit limit
      const stakeInfo = await getStakeInfo();
      if (!stakeInfo) {
        throw new Error('Failed to fetch stake information');
      }

      const availableCredit = Number(stakeInfo.creditLimit?.sub(stakeInfo.usedCredit || new BN(0))) / 1e9;
      if (amountNum > availableCredit) {
        throw new Error(`Amount exceeds available credit limit of ${availableCredit.toFixed(3)} SOL`);
      }

      const success = await processBNPLTransaction(amountNum);
      if (success) {
        toast.success('Transaction processed successfully');
        setAmount('');
      } else {
        throw new Error('Failed to process transaction');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <Card className="p-4">
        <p className="text-center text-muted-foreground">
          Connect your wallet to make BNPL transactions
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">Make BNPL Transaction</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (SOL)</Label>
          <Input
            id="amount"
            type="number"
            step="0.001"
            min={0.001}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount in SOL"
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Minimum transaction amount: {MIN_STAKE_AMOUNT} SOL
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Processing...' : 'Process Transaction'}
        </Button>
      </form>
    </Card>
  );
}
