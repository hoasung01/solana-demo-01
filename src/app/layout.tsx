import type { Metadata } from 'next'
import './globals.css'
import { Inter } from "next/font/google";
import { Toaster } from 'sonner';
import { WalletProvider } from '@/components/providers/wallet-provider';
import { MainLayout } from '@/components/layout/main-layout';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Solana BNPL',
  description: 'Buy Now Pay Later on Solana',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <WalletProvider>
          <MainLayout>{children}</MainLayout>
          <Toaster />
        </WalletProvider>
      </body>
    </html>
  )
}

// Patch BigInt so we can log it using JSON.stringify without any errors
declare global {
  interface BigInt {
    toJSON(): string
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString()
}
