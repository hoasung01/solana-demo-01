import type { Metadata } from 'next'
import './globals.css'
import { Inter } from "next/font/google";
import { Toaster } from 'sonner';
import { WalletProvider } from '@/components/providers/wallet-provider';
import { MainLayout } from '@/components/layout/main-layout';
import { Providers } from '@/components/providers';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'mSOL Payments',
  description: 'Pay for real-world utilities with your staked SOL',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <AppHeader />
            <main className="flex-1 container mx-auto px-4 py-8">
              {children}
            </main>
            <AppFooter />
          </div>
          <Toaster />
        </Providers>
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
