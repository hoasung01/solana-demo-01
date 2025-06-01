import type { Metadata } from 'next'
import './globals.css'
import { Inter } from "next/font/google";
import { ClientLayout } from '@/components/client-layout';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Solana Stake Pool Demo',
  description: 'A demo of Solana stake pool functionality',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
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
