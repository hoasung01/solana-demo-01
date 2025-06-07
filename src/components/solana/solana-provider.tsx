'use client'

import { FC, ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { clusterApiUrl } from '@solana/web3.js'

export const WalletButton = dynamic(async () => WalletMultiButton, {
  ssr: false,
})

export const ClusterButton: FC<{ children: ReactNode }> = ({ children }) => {
  return <div>{children}</div>
}

export function SolanaProvider({ children }: { children: ReactNode }) {
  return <div>{children}</div>
}
