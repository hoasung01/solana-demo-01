'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { useStakePool } from '@/hooks/use-stake-pool';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  timestamp: number;
  type: 'purchase' | 'payment';
}

export function TransactionHistory() {
  const { publicKey } = useWallet();
  const { getStakeInfo } = useStakePool();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!publicKey) return;

      try {
        const stakeInfo = await getStakeInfo();
        if (stakeInfo) {
          // TODO: In a real application, you would fetch actual transaction history
          // For now, we'll use mock data based on the stake info
          const mockTransactions: Transaction[] = [
            {
              id: '1',
              amount: Number(stakeInfo.usedCredit) / 1e9,
              status: 'completed',
              timestamp: Date.now() - 86400000, // 1 day ago
              type: 'purchase',
            },
            {
              id: '2',
              amount: 0.5,
              status: 'pending',
              timestamp: Date.now() - 3600000, // 1 hour ago
              type: 'payment',
            },
          ];

          setTransactions(mockTransactions);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        toast.error('Failed to fetch transaction history');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [publicKey, getStakeInfo]);

  if (!publicKey) {
    return (
      <Card className="p-4">
        <p className="text-center text-muted-foreground">
          Connect your wallet to view transaction history
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">Transaction History</h2>

      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="font-medium">
                    {tx.type === 'purchase' ? 'Purchase' : 'Payment'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(tx.timestamp, 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {tx.type === 'purchase' ? '-' : '+'}{tx.amount.toFixed(3)} SOL
                  </p>
                  <p className={`text-sm ${
                    tx.status === 'completed' ? 'text-green-500' :
                    tx.status === 'pending' ? 'text-yellow-500' :
                    'text-red-500'
                  }`}>
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </p>
                </div>
              </div>
            ))}

            {transactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}
