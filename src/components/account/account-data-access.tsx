'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { toast } from 'sonner'
import { useTransactionToast } from '../use-transaction-toast'

export function useGetBalance({ address }: { address: PublicKey }) {
  const { connection } = useConnection()

  return useQuery({
    queryKey: ['get-balance', address.toString()],
    queryFn: () => connection.getBalance(address),
  })
}

export function useGetSignatures({ address }: { address: PublicKey }) {
  const { connection } = useConnection()

  return useQuery({
    queryKey: ['get-signatures', address.toString()],
    queryFn: () => connection.getSignaturesForAddress(address),
  })
}

export function useGetTokenAccounts({ address }: { address: PublicKey }) {
  const { connection } = useConnection()

  return useQuery({
    queryKey: ['get-token-accounts', address.toString()],
    queryFn: async () => {
      const [tokenAccounts, token2022Accounts] = await Promise.all([
        connection.getParsedTokenAccountsByOwner(address, { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }),
        connection.getParsedTokenAccountsByOwner(address, { programId: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb') }),
      ])
      return [...tokenAccounts.value, ...token2022Accounts.value]
    },
  })
}

export function useTransferSol({ address }: { address: PublicKey }) {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  const toastTransaction = useTransactionToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['transfer-sol', address.toString()],
    mutationFn: async (input: { destination: PublicKey; amount: number }) => {
      if (!publicKey) {
        throw new Error('Wallet not connected')
      }

      try {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: input.destination,
            lamports: input.amount * LAMPORTS_PER_SOL,
          })
        )

        const signature = await sendTransaction(transaction, connection)
        await connection.confirmTransaction(signature)
        return signature
      } catch (error) {
        console.error('Transaction failed:', error)
        throw error
      }
    },
    onSuccess: (signature) => {
      if (signature) {
        toastTransaction(signature)
      }
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['get-balance', address.toString()],
        }),
        queryClient.invalidateQueries({
          queryKey: ['get-signatures', address.toString()],
        }),
      ])
    },
    onError: (error) => {
      toast.error(`Transaction failed! ${error}`)
    },
  })
}

export function useRequestAirdrop({ address }: { address: PublicKey }) {
  const { connection } = useConnection()
  const queryClient = useQueryClient()
  const toastTransaction = useTransactionToast()

  return useMutation({
    mutationKey: ['airdrop', address.toString()],
    mutationFn: async (amount: number = 1) => {
      const signature = await connection.requestAirdrop(
        address,
        amount * LAMPORTS_PER_SOL
      )
      await connection.confirmTransaction(signature)
      return signature
    },
    onSuccess: (signature) => {
      toastTransaction(signature)
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ['get-balance', address.toString()] }),
        queryClient.invalidateQueries({ queryKey: ['get-signatures', address.toString()] }),
      ])
    },
  })
}
