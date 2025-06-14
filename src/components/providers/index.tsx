'use client';

import { WalletProvider } from './wallet-provider';
import { QueryClientProvider } from './query-client-provider';
import { ThemeProvider } from './theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider>
        <WalletProvider>
          {children}
        </WalletProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
