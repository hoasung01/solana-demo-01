'use client';

import { StakeForm, WalletConnect, WalletBalance } from "@/components/stake-pool";

export default function Home() {
  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="mb-8 text-4xl font-bold">Solana Stake Pool Demo</h1>
      <div className="grid gap-4">
        <div>
          <WalletConnect />
        </div>
        <div>
          <WalletBalance />
        </div>
        <div>
          <StakeForm />
        </div>
      </div>
    </main>
  );
}
