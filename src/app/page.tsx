import { StakeForm, WalletConnect, WalletBalance } from "@/components/stake-pool";

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">Solana Stake Pool</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <WalletConnect />
          <div className="mt-4">
            <WalletBalance />
          </div>
        </div>
        <StakeForm />
      </div>
    </main>
  );
}
