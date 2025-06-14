import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMarinadeStaking } from '@/hooks/use-marinade-staking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function CreditCardContent() {
  const { publicKey } = useWallet();
  const { mSolBalance } = useMarinadeStaking();
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const handleAddCard = async () => {
    // Implement card addition logic here
    // This would typically involve:
    // 1. Validating card details
    // 2. Creating a secure token with a payment processor
    // 3. Storing the token securely
    console.log('Adding card:', { cardNumber, expiryDate, cvv });
  };

  const handlePayment = async (amount: number) => {
    // Implement payment logic here
    // This would typically involve:
    // 1. Converting mSOL to fiat
    // 2. Processing the payment through the payment processor
    // 3. Updating the user's balance
    console.log('Processing payment:', amount);
  };

  if (!publicKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connect Wallet</CardTitle>
          <CardDescription>Please connect your wallet to manage cards and payments</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Credit Card Management</CardTitle>
          <CardDescription>
            Add and manage your credit cards for making payments with mSOL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="add-card">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="add-card">Add Card</TabsTrigger>
              <TabsTrigger value="payments">Make Payment</TabsTrigger>
            </TabsList>
            <TabsContent value="add-card">
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Card Number"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="text"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                  <Input
                    type="text"
                    placeholder="CVV"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddCard} className="w-full">
                  Add Card
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="payments">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Available mSOL:</span>
                  <span className="text-sm">{mSolBalance?.toFixed(4) || '0'} mSOL</span>
                </div>
                <Input
                  type="number"
                  placeholder="Payment Amount (USD)"
                  min="0"
                  step="0.01"
                />
                <Button onClick={() => handlePayment(100)} className="w-full">
                  Make Payment
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View your recent payments and transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add payment history list here */}
            <p className="text-sm text-muted-foreground">No recent payments</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
