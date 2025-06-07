'use client';

import { FC, ReactNode, useMemo, useCallback, useState } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork, WalletError } from '@solana/wallet-adapter-base';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { clusterApiUrl } from '@solana/web3.js';
import { toast } from 'sonner';
import { RPCConfig } from '@/components/solana/rpc-config';

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: FC<WalletProviderProps> = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = WalletAdapterNetwork.Devnet;

  // State for custom RPC endpoint
  const [customEndpoint, setCustomEndpoint] = useState<string | null>(null);

  // You can also provide a custom RPC endpoint
  const endpoint = useMemo(() => {
    return customEndpoint || clusterApiUrl(network);
  }, [network, customEndpoint]);

  // Initialize Solflare wallet adapter
  const wallets = useMemo(
    () => [
      new SolflareWalletAdapter(),
    ],
    []
  );

  // Handle wallet errors
  const onError = useCallback((error: WalletError) => {
    console.error('Wallet error:', error);
    toast.error(error.message || 'Wallet error occurred');
  }, []);

  // Handle RPC endpoint changes
  const handleEndpointChange = useCallback((newEndpoint: string) => {
    setCustomEndpoint(newEndpoint);
    toast.success('RPC endpoint updated');
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider
        wallets={wallets}
        autoConnect
        onError={onError}
      >
        <div className="fixed bottom-4 right-4 z-50">
          <RPCConfig
            currentEndpoint={endpoint}
            onEndpointChange={handleEndpointChange}
          />
        </div>
        {children}
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
