'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState } from 'react';

export function WalletConnect() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="flex items-center justify-center">
                <div className="h-10 w-[200px] animate-pulse rounded-lg bg-gray-200" />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center">
            <WalletMultiButton className="!bg-primary hover:!bg-primary/90" />
        </div>
    );
}
