'use client';

import { useState, useEffect } from 'react';
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

export function StakeManager() {
  const { publicKey, connected } = useWallet();
  const { loading: programLoading, error: programError, getStakeInfo, initializeStakePool, stake, unstake } = useStakePool();
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [stakeInfo, setStakeInfo] = useState<{
    totalStaked: number;
    rewardRate: number;
    lastUpdateTime: number;
    authority: string;
    usedCredit: number;
  } | null>(null);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    const fetchStakeInfo = async () => {
      if (!connected || !publicKey) return;

      try {
        const info = await getStakeInfo();
        if (info) {
          setStakeInfo(info);
        }
      } catch (error) {
        console.error('Error fetching stake info:', error);
      }
    };

    fetchStakeInfo();
  }, [connected, publicKey, getStakeInfo]);

  const handleInitialize = async () => {
    setInitializing(true);
    setError('');

    try {
      const success = await initializeStakePool();
      if (success) {
        toast.success('Stake pool initialized successfully');
        // Refresh stake info
        const info = await getStakeInfo();
        if (info) {
          setStakeInfo(info);
        }
      } else {
        throw new Error('Failed to initialize stake pool');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      toast.error(message);
    } finally {
      setInitializing(false);
    }
  };

  const validateAmount = (amountNum: number): string | null => {
    if (isNaN(amountNum) || amountNum <= 0) {
      return 'Please enter a valid amount';
    }

    if (amountNum < MIN_STAKE_AMOUNT) {
      return `Minimum stake amount is ${MIN_STAKE_AMOUNT} SOL`;
    }

    if (stakeInfo) {
      if (amountNum > stakeInfo.totalStaked) {
        return `Amount exceeds your total staked amount of ${stakeInfo.totalStaked.toFixed(3)} SOL`;
      }
    }

    return null;
  };

  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!connected || !publicKey) {
        throw new Error('Please connect your wallet');
      }

      const amountNum = parseFloat(amount);
      const validationError = validateAmount(amountNum);
      if (validationError) {
        throw new Error(validationError);
      }

      const success = await stake(amountNum);
      if (success) {
        toast.success('Stake successful');
        setAmount('');

        // Refresh stake info
        const info = await getStakeInfo();
        if (info) {
          setStakeInfo(info);
        }
      } else {
        throw new Error('Failed to stake');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!connected || !publicKey) {
        throw new Error('Please connect your wallet');
      }

      const amountNum = parseFloat(amount);
      const validationError = validateAmount(amountNum);
      if (validationError) {
        throw new Error(validationError);
      }

      // Check if unstaking would affect credit limit
      if (stakeInfo) {
        const remainingStake = stakeInfo.totalStaked - amountNum;
        const creditLimit = remainingStake * 0.3; // 30% of remaining stake

        if (stakeInfo.usedCredit > creditLimit) {
          throw new Error(
            `Cannot unstake ${amountNum} SOL as it would reduce your credit limit below your used credit of ${stakeInfo.usedCredit.toFixed(3)} SOL`
          );
        }
      }

      const success = await unstake(amountNum);
      if (success) {
        toast.success('Unstake successful');
        setAmount('');

        // Refresh stake info
        const info = await getStakeInfo();
        if (info) {
          setStakeInfo(info);
        }
      } else {
        throw new Error('Failed to unstake');
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
          Connect your wallet to manage stakes
        </p>
      </Card>
    );
  }

  if (programLoading) {
    return (
      <Card className="p-4">
        <p className="text-center text-muted-foreground">
          Initializing program...
        </p>
      </Card>
    );
  }

  if (programError) {
    return (
      <Card className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{programError}</AlertDescription>
        </Alert>
      </Card>
    );
  }

  if (!stakeInfo) {
    return (
      <Card className="p-4">
        <div className="space-y-4">
          <p className="text-center text-muted-foreground">
            Stake pool needs to be initialized
          </p>
          <Button
            className="w-full"
            onClick={handleInitialize}
            disabled={initializing}
          >
            {initializing ? 'Initializing...' : 'Initialize Stake Pool'}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">Manage Stakes</h2>

      {stakeInfo && (
        <div className="mb-4 p-3 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">Total Staked</p>
          <p className="text-lg font-semibold">
            {stakeInfo.totalStaked.toFixed(3)} SOL
          </p>
        </div>
      )}

      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (SOL)</Label>
          <Input
            id="amount"
            type="number"
            step="0.001"
            min={MIN_STAKE_AMOUNT}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount to stake/unstake"
            disabled={loading}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            type="submit"
            onClick={handleStake}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Staking...' : 'Stake'}
          </Button>
          <Button
            type="submit"
            onClick={handleUnstake}
            disabled={loading}
            variant="outline"
            className="flex-1"
          >
            {loading ? 'Unstaking...' : 'Unstake'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
