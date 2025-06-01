'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function WalletBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    const fetchBalance = async () => {
      try {
        const bal = await connection.getBalance(publicKey);
        setBalance(bal / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance(null);
      }
    };

    fetchBalance();
    // Subscribe to balance changes
    const subscriptionId = connection.onAccountChange(
      publicKey,
      (accountInfo) => {
        setBalance(accountInfo.lamports / LAMPORTS_PER_SOL);
      }
    );

    return () => {
      connection.removeAccountChangeListener(subscriptionId);
    };
  }, [connection, publicKey]);

  if (!publicKey) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">
          {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
        </p>
      </CardContent>
    </Card>
  );
}
