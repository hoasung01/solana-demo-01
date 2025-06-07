'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function WalletConnect() {
  const { connected, connect, disconnect, publicKey } = useWallet();

  const handleConnect = async () => {
    try {
      await connect();
      toast.success('Connected to Solflare');
    } catch {
      toast.error('Failed to connect to Solflare');
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.success('Disconnected from Solflare');
  };

  if (connected) {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm text-muted-foreground">
          Connected: {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
        </div>
        <Button
          variant="outline"
          onClick={handleDisconnect}
          className="w-full"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      className="w-full"
    >
      Connect Solflare
    </Button>
  );
}
