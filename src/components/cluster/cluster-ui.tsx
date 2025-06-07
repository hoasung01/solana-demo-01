'use client'

import { useQuery } from '@tanstack/react-query'
import * as React from 'react'
import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AppAlert } from '@/components/app-alert'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Connection } from '@solana/web3.js'
import { useConnection } from '@solana/wallet-adapter-react'

interface ExplorerLinkProps {
  address?: string
  block?: string
  transaction?: string
  className?: string
  label: string
}

export function ExplorerLink({
  className,
  label = '',
  ...link
}: ExplorerLinkProps) {
  const getExplorerLink = () => {
    const baseUrl = 'https://explorer.solana.com'
    if (link.address) {
      return `${baseUrl}/address/${link.address}`
    }
    if (link.block) {
      return `${baseUrl}/block/${link.block}`
    }
    if (link.transaction) {
      return `${baseUrl}/tx/${link.transaction}`
    }
    return baseUrl
  }

  return (
    <a
      href={getExplorerLink()}
      target="_blank"
      rel="noopener noreferrer"
      className={className ? className : `link font-mono`}
    >
      {label}
    </a>
  )
}

export function ClusterChecker({ children }: { children: ReactNode }) {
  const { connection } = useConnection()
  const { cluster } = useWallet()

  const query = useQuery({
    queryKey: ['version', { cluster, endpoint: connection.rpcEndpoint }],
    queryFn: () => connection.getVersion(),
    retry: 1,
  })

  if (query.isLoading) {
    return null
  }

  if (query.isError || !query.data) {
    return (
      <AppAlert
        action={
          <Button variant="outline" onClick={() => query.refetch()}>
            Refresh
          </Button>
        }
      >
        Error connecting to cluster <span className="font-bold">{cluster}</span>.
      </AppAlert>
    )
  }

  return children
}
