'use client';

import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useWallet } from '@solana/wallet-adapter-react';

export default function SettingsPage() {
  const { connected } = useWallet();

  if (!connected) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-4">
          <p className="text-center text-muted-foreground">
            Please connect your wallet to view settings
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="transaction-notifications">Transaction Notifications</Label>
              <Switch id="transaction-notifications" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="price-alerts">Price Alerts</Label>
              <Switch id="price-alerts" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Display Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <Switch id="dark-mode" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="compact-view">Compact View</Label>
              <Switch id="compact-view" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-lock">Auto Lock Wallet</Label>
              <Switch id="auto-lock" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="confirm-transactions">Confirm All Transactions</Label>
              <Switch id="confirm-transactions" defaultChecked />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
