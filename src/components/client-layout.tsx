'use client';

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { Toaster } from "sonner";
import { AppProviders } from './app-providers';
import { AppLayout } from './app-layout';
import React from 'react';

// Import styles
import '@solana/wallet-adapter-react-ui/styles.css';

const links: { label: string; path: string }[] = [
  { label: 'Home', path: '/' },
  { label: 'Account', path: '/account' },
]

// Cấu hình network
const network = WalletAdapterNetwork.Devnet;
const endpoint = clusterApiUrl(network);
const wallets = [new PhantomWalletAdapter()];

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <AppProviders>
            <AppLayout links={links}>{children}</AppLayout>
          </AppProviders>
          <Toaster />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
