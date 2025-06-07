import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useCallback, useEffect, useState } from 'react';
import { BN } from 'bn.js';
import { STAKE_POOL_PROGRAM_ID } from '@/lib/constants';
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

// Instruction indexes
const INSTRUCTION_INDEX = {
  INITIALIZE: 0,
  STAKE: 1,
  UNSTAKE: 2,
  CLAIM_REWARDS: 3,
  LINK_CARD: 4,
  UNLINK_CARD: 5,
  PROCESS_BNPL: 6,
};

export function useStakePool() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stakePoolPda, setStakePoolPda] = useState<PublicKey | null>(null);

  useEffect(() => {
    const initProgram = async () => {
      if (!wallet.publicKey) {
        setLoading(false);
        return;
      }

      try {
        // Find PDA for stake pool
        const [pda] = PublicKey.findProgramAddressSync(
          [Buffer.from('stake_pool')],
          new PublicKey(STAKE_POOL_PROGRAM_ID)
        );
        setStakePoolPda(pda);
        setError(null);
      } catch (err) {
        console.error('Error initializing program:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize program');
      } finally {
        setLoading(false);
      }
    };

    initProgram();
  }, [wallet.publicKey]);

  const initializeStakePool = useCallback(async () => {
    if (!wallet.publicKey || !stakePoolPda) {
      throw new Error('Wallet or stake pool not initialized');
    }

    try {
      const transaction = new Transaction();
      transaction.add(
        new TransactionInstruction({
          keys: [
            { pubkey: stakePoolPda, isSigner: false, isWritable: true },
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          programId: new PublicKey(STAKE_POOL_PROGRAM_ID),
          data: Buffer.from([INSTRUCTION_INDEX.INITIALIZE]),
        })
      );

      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);

      return true;
    } catch (err) {
      console.error('Error initializing stake pool:', err);
      return false;
    }
  }, [wallet, connection, stakePoolPda]);

  const getStakeInfo = useCallback(async () => {
    if (!stakePoolPda) return null;

    try {
      const accountInfo = await connection.getAccountInfo(stakePoolPda);
      if (!accountInfo) {
        return null;
      }

      // Parse account data
      const data = accountInfo.data;
      const totalStaked = new BN(data.slice(0, 8), 'le');
      const rewardRate = new BN(data.slice(8, 16), 'le');
      const lastUpdateTime = new BN(data.slice(16, 24), 'le');
      const authority = new PublicKey(data.slice(24, 56));
      const creditLimit = totalStaked.muln(CREDIT_LIMIT_PERCENTAGE).divn(100);
      const usedCredit = new BN(0); // For now, we'll set this to 0

      return {
        totalStaked,
        rewardRate,
        lastUpdateTime,
        authority,
        creditLimit,
        usedCredit,
      };
    } catch (err) {
      console.error('Error fetching stake info:', err);
      return null;
    }
  }, [connection, stakePoolPda]);

  const stake = useCallback(async (amount: number) => {
    if (!wallet.publicKey || !stakePoolPda) {
      throw new Error('Wallet or stake pool not initialized');
    }

    try {
      const lamports = amount * LAMPORTS_PER_SOL;
      const transaction = new Transaction();

      // Add transfer instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: stakePoolPda,
          lamports,
        })
      );

      // Add stake instruction
      transaction.add(
        new TransactionInstruction({
          keys: [
            { pubkey: stakePoolPda, isSigner: false, isWritable: true },
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          ],
          programId: new PublicKey(STAKE_POOL_PROGRAM_ID),
          data: Buffer.from([
            INSTRUCTION_INDEX.STAKE,
            ...new BN(lamports).toArray('le', 8),
          ]),
        })
      );

      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);

      return true;
    } catch (err) {
      console.error('Error staking:', err);
      return false;
    }
  }, [wallet, connection, stakePoolPda]);

  const unstake = useCallback(async (amount: number) => {
    if (!wallet.publicKey || !stakePoolPda) {
      throw new Error('Wallet or stake pool not initialized');
    }

    try {
      const lamports = amount * LAMPORTS_PER_SOL;
      const transaction = new Transaction();

      transaction.add(
        new TransactionInstruction({
          keys: [
            { pubkey: stakePoolPda, isSigner: false, isWritable: true },
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          ],
          programId: new PublicKey(STAKE_POOL_PROGRAM_ID),
          data: Buffer.from([
            INSTRUCTION_INDEX.UNSTAKE,
            ...new BN(lamports).toArray('le', 8),
          ]),
        })
      );

      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);

      return true;
    } catch (err) {
      console.error('Error unstaking:', err);
      return false;
    }
  }, [wallet, connection, stakePoolPda]);

  const processBNPLTransaction = useCallback(async (amount: number) => {
    if (!wallet.publicKey || !stakePoolPda) {
      throw new Error('Wallet or stake pool not initialized');
    }

    try {
      const lamports = amount * LAMPORTS_PER_SOL;
      const transaction = new Transaction();

      transaction.add(
        new TransactionInstruction({
          keys: [
            { pubkey: stakePoolPda, isSigner: false, isWritable: true },
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          ],
          programId: new PublicKey(STAKE_POOL_PROGRAM_ID),
          data: Buffer.from([
            INSTRUCTION_INDEX.PROCESS_BNPL,
            ...new BN(lamports).toArray('le', 8),
          ]),
        })
      );

      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);

      return true;
    } catch (err) {
      console.error('Error processing BNPL transaction:', err);
      return false;
    }
  }, [wallet, connection, stakePoolPda]);

  return {
    loading,
    error,
    getStakeInfo,
    initializeStakePool,
    stake,
    unstake,
    processBNPLTransaction,
  };
}
