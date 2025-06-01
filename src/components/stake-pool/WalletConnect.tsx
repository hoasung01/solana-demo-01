'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from "@/components/ui/button";

export function WalletConnect() {
    const { publicKey } = useWallet();

    return (
        <div className="flex items-center gap-4">
            {publicKey ? (
                <div className="text-sm text-muted-foreground">
                    Đã kết nối: {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
                </div>
            ) : null}
            <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90" />
        </div>
    );
}
