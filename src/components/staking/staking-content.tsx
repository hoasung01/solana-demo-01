import { useState } from 'react';
import { useMarinadeStaking } from '@/hooks/use-marinade-staking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWallet } from '@solana/wallet-adapter-react';

export function StakingContent() {
  const { publicKey } = useWallet();
  const { mSolBalance, isLoadingBalance, stake, isStaking } = useMarinadeStaking();
  const [amount, setAmount] = useState<string>('');

  const handleStake = async () => {
    if (!amount) return;
    try {
      await stake(parseFloat(amount));
      setAmount('');
    } catch (error) {
      console.error('Staking error:', error);
    }
  };

  if (!publicKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connect Wallet</CardTitle>
          <CardDescription>Please connect your wallet to start staking</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Liquid Staking with Marinade</CardTitle>
          <CardDescription>
            Stake your SOL to earn rewards and get mSOL tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Your mSOL Balance:</span>
              <span className="text-sm">
                {isLoadingBalance ? 'Loading...' : `${mSolBalance?.toFixed(4) || '0'} mSOL`}
              </span>
            </div>
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Amount of SOL to stake"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.1"
              />
              <Button
                onClick={handleStake}
                disabled={!amount || isStaking}
                className="w-full"
              >
                {isStaking ? 'Staking...' : 'Stake SOL'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What is mSOL?</CardTitle>
          <CardDescription>
            mSOL is a liquid staking token that represents your staked SOL position in Marinade Finance.
            You can use mSOL to:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-4 space-y-2">
            <li>Earn staking rewards automatically</li>
            <li>Use mSOL in DeFi protocols</li>
            <li>Pay for real-world utilities with your mSOL</li>
            <li>Unstake at any time</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
