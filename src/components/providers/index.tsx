'use client';

import { QueryClientProvider } from './query-client-provider';
import { ThemeProvider } from './theme-provider';
import { StripeProvider } from './stripe-provider';
import { WalletProvider } from './wallet-provider';

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <QueryClientProvider>
      <ThemeProvider>
        <WalletProvider>
          <StripeProvider>
            {children}
          </StripeProvider>
        </WalletProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
