'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useStakePool } from '@/hooks/use-stake-pool';
import { CREDIT_LIMIT_PERCENTAGE } from '@/lib/constants';

interface CreditLimitInfo {
  totalLimit: number;
  usedAmount: number;
  availableAmount: number;
  stakeAmount: number;
}

export function CreditLimit() {
  const { connected } = useWallet();
  const { getStakeInfo } = useStakePool();
  const [creditInfo, setCreditInfo] = useState<CreditLimitInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreditInfo = async () => {
      if (!connected) {
        setCreditInfo(null);
        setLoading(false);
        return;
      }

      try {
        const stakeInfo = await getStakeInfo();
        if (stakeInfo) {
          const totalLimit = stakeInfo.totalStaked * (CREDIT_LIMIT_PERCENTAGE / 100);
          // For now, we'll set usedAmount to 0 since it's not available in the stake info
          const usedAmount = 0;
          const availableAmount = totalLimit - usedAmount;

          setCreditInfo({
            totalLimit,
            usedAmount,
            availableAmount,
            stakeAmount: stakeInfo.totalStaked,
          });
        }
      } catch (error) {
        console.error('Error fetching credit info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreditInfo();
  }, [connected, getStakeInfo]);

  if (!connected) {
    return (
      <Card className="p-4">
        <p className="text-center text-muted-foreground">
          Connect your wallet to view credit limit
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-4">
        <p className="text-center text-muted-foreground">Loading...</p>
      </Card>
    );
  }

  if (!creditInfo) {
    return (
      <Card className="p-4">
        <p className="text-center text-muted-foreground">
          No credit limit information available
        </p>
      </Card>
    );
  }

  const usedPercentage = creditInfo.totalLimit === 0
    ? 0
    : (creditInfo.usedAmount / creditInfo.totalLimit) * 100;

  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">Credit Limit</h2>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Used Credit</span>
            <span>{creditInfo.usedAmount.toFixed(3)} SOL</span>
          </div>
          <Progress value={usedPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Limit</p>
            <p className="text-lg font-semibold">
              {creditInfo.totalLimit.toFixed(3)} SOL
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-lg font-semibold">
              {creditInfo.availableAmount.toFixed(3)} SOL
            </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">Total Staked</p>
          <p className="text-lg font-semibold">
            {creditInfo.stakeAmount.toFixed(3)} SOL
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Credit limit is {CREDIT_LIMIT_PERCENTAGE}% of your total stake
          </p>
        </div>
      </div>
    </Card>
  );
}
