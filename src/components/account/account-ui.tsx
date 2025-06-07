'use client'

import { RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { ExplorerLink } from '../cluster/cluster-ui'
import {
  useGetBalance,
  useGetSignatures,
  useGetTokenAccounts,
  useRequestAirdrop,
  useTransferSol,
} from './account-data-access'
import { ellipsify } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AppAlert } from '@/components/app-alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AppModal } from '@/components/app-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function AccountBalance({ address }: { address: PublicKey }) {
  const query = useGetBalance({ address })

  return (
    <h1 className="text-5xl font-bold cursor-pointer" onClick={() => query.refetch()}>
      {query.data ? `${query.data / LAMPORTS_PER_SOL} SOL` : '...'}
    </h1>
  )
}

export function AccountChecker() {
  const { publicKey } = useWallet()
  if (!publicKey) {
    return null
  }
  return <AccountBalanceCheck address={publicKey} />
}

export function AccountBalanceCheck({ address }: { address: PublicKey }) {
  const mutation = useRequestAirdrop({ address })
  const query = useGetBalance({ address })

  if (query.isLoading) {
    return null
  }
  if (query.isError || !query.data) {
    return (
      <AppAlert
        action={
          <Button variant="outline" onClick={() => mutation.mutateAsync(1).catch((err) => console.log(err))}>
            Request Airdrop
          </Button>
        }
      >
        Your account is not found on this cluster.
      </AppAlert>
    )
  }
  return null
}

export function AccountButtons({ address }: { address: PublicKey }) {
  const { publicKey } = useWallet()
  return (
    <div>
      <div className="space-x-2">
        <ModalAirdrop address={address} />
        {publicKey ? <ModalSend address={address} /> : null}
        <ModalReceive address={address} />
      </div>
    </div>
  )
}

export function AccountTokens({ address }: { address: PublicKey }) {
  const query = useGetTokenAccounts({ address })

  return (
    <div className="space-y-4">
      {query.data?.map((account) => (
        <div key={account.pubkey.toString()} className="flex items-center justify-between">
          <div>
            <div className="font-medium">{account.pubkey.toString()}</div>
            <div className="text-sm text-muted-foreground">
              {account.account.data.parsed.info.mint}
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">
              {account.account.data.parsed.info.tokenAmount.uiAmount}
            </div>
            <div className="text-sm text-muted-foreground">
              {account.account.data.parsed.info.tokenAmount.uiAmountString}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function AccountTransactions({ address }: { address: PublicKey }) {
  const query = useGetSignatures({ address })
  const [showAll, setShowAll] = useState(false)

  const items = useMemo(() => {
    if (showAll) return query.data
    return query.data?.slice(0, 5)
  }, [query.data, showAll])

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Transaction History</h2>
        <div className="space-x-2">
          {query.isLoading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            <Button variant="outline" onClick={() => query.refetch()}>
              <RefreshCw size={16} />
            </Button>
          )}
        </div>
      </div>
      {query.isError && <pre className="alert alert-error">Error: {query.error?.message.toString()}</pre>}
      {query.isSuccess && (
        <div>
          {query.data.length === 0 ? (
            <div>No transactions found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Signature</TableHead>
                  <TableHead className="text-right">Slot</TableHead>
                  <TableHead>Block Time</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map((item) => (
                  <TableRow key={item.signature}>
                    <TableHead className="font-mono">
                      <ExplorerLink transaction={item.signature} label={ellipsify(item.signature, 8)} />
                    </TableHead>
                    <TableCell className="font-mono text-right">
                      <ExplorerLink block={item.slot.toString()} label={item.slot.toString()} />
                    </TableCell>
                    <TableCell>{new Date((Number(item.blockTime) ?? 0) * 1000).toISOString()}</TableCell>
                    <TableCell className="text-right">
                      {item.err ? (
                        <span className="text-red-500" title={item.err.toString()}>
                          Failed
                        </span>
                      ) : (
                        <span className="text-green-500">Success</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(query.data?.length ?? 0) > 5 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      <Button variant="outline" onClick={() => setShowAll(!showAll)}>
                        {showAll ? 'Show Less' : 'Show All'}
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  )
}

function ModalReceive({ address }: { address: PublicKey }) {
  return (
    <AppModal title="Receive">
      <p>Receive assets by sending them to your public key:</p>
      <code>{address.toString()}</code>
    </AppModal>
  )
}

function ModalAirdrop({ address }: { address: PublicKey }) {
  const mutation = useRequestAirdrop({ address })
  const [amount, setAmount] = useState('2')

  return (
    <AppModal
      title="Airdrop"
      submitDisabled={!amount || mutation.isPending}
      submitLabel="Request Airdrop"
      submit={() => mutation.mutateAsync(parseFloat(amount))}
    >
      <Label htmlFor="amount">Amount</Label>
      <Input
        disabled={mutation.isPending}
        id="amount"
        min="1"
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        step="any"
        type="number"
        value={amount}
      />
    </AppModal>
  )
}

function ModalSend({ address }: { address: PublicKey }) {
  const mutation = useTransferSol({ address })
  const [destination, setDestination] = useState('')
  const [amount, setAmount] = useState('1')
  const { toast } = useToast()

  const handleSubmit = async () => {
    try {
      const destPubkey = new PublicKey(destination)
      await mutation.mutateAsync({
        destination: destPubkey,
        amount: parseFloat(amount),
      })
      setDestination('')
      setAmount('')
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to transfer SOL',
        variant: 'destructive',
      })
    }
  }

  return (
    <AppModal
      title="Send"
      submitDisabled={!destination || !amount || mutation.isPending}
      submitLabel="Send"
      submit={handleSubmit}
    >
      <Label htmlFor="destination">Destination</Label>
      <Input
        disabled={mutation.isPending}
        id="destination"
        onChange={(e) => setDestination(e.target.value)}
        placeholder="Destination"
        type="text"
        value={destination}
      />
      <Label htmlFor="amount">Amount</Label>
      <Input
        disabled={mutation.isPending}
        id="amount"
        min="1"
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        step="any"
        type="number"
        value={amount}
      />
    </AppModal>
  )
}

export function AccountSignatures({ address }: { address: PublicKey }) {
  const query = useGetSignatures({ address })

  return (
    <div className="space-y-4">
      {query.data?.map((sig) => (
        <div key={sig.signature} className="flex items-center justify-between">
          <div className="font-medium">{sig.signature}</div>
          <div className="text-sm text-muted-foreground">
            {new Date(sig.blockTime! * 1000).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )
}

export function AccountTransfer({ address }: { address: PublicKey }) {
  const { publicKey } = useWallet()
  const [destination, setDestination] = useState('')
  const [amount, setAmount] = useState('')
  const { toast } = useToast()
  const transfer = useTransferSol({ address })

  const handleTransfer = async () => {
    if (!destination || !amount) {
      toast({
        title: 'Error',
        description: 'Please enter both destination and amount',
        variant: 'destructive',
      })
      return
    }

    try {
      const destPubkey = new PublicKey(destination)
      await transfer.mutateAsync({
        destination: destPubkey,
        amount: parseFloat(amount),
      })
      setDestination('')
      setAmount('')
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to transfer SOL',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="destination">Destination Address</Label>
        <Input
          id="destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Enter destination address"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (SOL)</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount in SOL"
        />
      </div>
      <Button onClick={handleTransfer} disabled={!publicKey || transfer.isPending}>
        {transfer.isPending ? 'Transferring...' : 'Transfer SOL'}
      </Button>
    </div>
  )
}

export function AccountAirdrop({ address }: { address: PublicKey }) {
  const { toast } = useToast()
  const airdrop = useRequestAirdrop({ address })

  const handleAirdrop = async () => {
    try {
      await airdrop.mutateAsync()
      toast({
        title: 'Success',
        description: 'Airdrop requested successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to request airdrop',
        variant: 'destructive',
      })
    }
  }

  return (
    <Button onClick={handleAirdrop} disabled={airdrop.isPending}>
      {airdrop.isPending ? 'Requesting...' : 'Request Airdrop'}
    </Button>
  )
}

export function AccountCard({ address }: { address: PublicKey }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>{address.toString()}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="balance">
          <TabsList>
            <TabsTrigger value="balance">Balance</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="signatures">Signatures</TabsTrigger>
            <TabsTrigger value="transfer">Transfer</TabsTrigger>
          </TabsList>
          <TabsContent value="balance">
            <AccountBalance address={address} />
          </TabsContent>
          <TabsContent value="tokens">
            <AccountTokens address={address} />
          </TabsContent>
          <TabsContent value="signatures">
            <AccountSignatures address={address} />
          </TabsContent>
          <TabsContent value="transfer">
            <AccountTransfer address={address} />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <AccountAirdrop address={address} />
      </CardFooter>
    </Card>
  )
}
