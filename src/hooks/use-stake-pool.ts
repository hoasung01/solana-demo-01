import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useCallback, useEffect, useState } from 'react';
import { STAKE_POOL_PROGRAM_ID, CREDIT_LIMIT_PERCENTAGE } from '@/lib/constants';
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
  const { publicKey, connected, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stakePoolPda, setStakePoolPda] = useState<PublicKey | null>(null);

  useEffect(() => {
    const initProgram = async () => {
      if (!connected || !publicKey) {
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
  }, [connected, publicKey]);

  const initializeStakePool = useCallback(async () => {
    if (!connected || !publicKey || !stakePoolPda) {
      throw new Error('Please connect your wallet first');
    }

    try {
      const transaction = new Transaction();
      transaction.add(
        new TransactionInstruction({
          keys: [
            { pubkey: stakePoolPda, isSigner: false, isWritable: true },
            { pubkey: publicKey, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          programId: new PublicKey(STAKE_POOL_PROGRAM_ID),
          data: Buffer.from([INSTRUCTION_INDEX.INITIALIZE]),
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);

      return true;
    } catch (err) {
      console.error('Error initializing stake pool:', err);
      return false;
    }
  }, [connected, publicKey, connection, stakePoolPda, sendTransaction]);

  const getStakeInfo = useCallback(async () => {
    if (!stakePoolPda) return null;

    try {
      const accountInfo = await connection.getAccountInfo(stakePoolPda);
      if (!accountInfo) {
        return null;
      }

      // Parse account data
      const data = accountInfo.data;
      const totalStaked = Number(data.readBigUInt64LE(0)) / LAMPORTS_PER_SOL;
      const rewardRate = Number(data.readBigUInt64LE(8)) / LAMPORTS_PER_SOL;
      const lastUpdateTime = Number(data.readBigUInt64LE(16));
      const authority = new PublicKey(data.slice(24, 56)).toBase58();
      const creditLimit = totalStaked * (CREDIT_LIMIT_PERCENTAGE / 100);
      const usedCredit = 0; // For now, we'll set this to 0

      // For now, we'll return an empty array for linkedCards
      // In a real implementation, this would be parsed from the account data
      const linkedCards: { id: string; lastFour: string }[] = [];

      return {
        totalStaked,
        rewardRate,
        lastUpdateTime,
        authority,
        creditLimit,
        usedCredit,
        linkedCards,
      };
    } catch (err) {
      console.error('Error fetching stake info:', err);
      return null;
    }
  }, [connection, stakePoolPda]);

  const stake = useCallback(async (amount: number) => {
    if (!connected || !publicKey || !stakePoolPda) {
      throw new Error('Please connect your wallet first');
    }

    try {
      const lamports = amount * LAMPORTS_PER_SOL;
      const transaction = new Transaction();

      // Add transfer instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: stakePoolPda,
          lamports,
        })
      );

      // Add stake instruction
      transaction.add(
        new TransactionInstruction({
          keys: [
            { pubkey: stakePoolPda, isSigner: false, isWritable: true },
            { pubkey: publicKey, isSigner: true, isWritable: true },
          ],
          programId: new PublicKey(STAKE_POOL_PROGRAM_ID),
          data: Buffer.from([
            INSTRUCTION_INDEX.STAKE,
            ...new Uint8Array(new BigUint64Array([BigInt(lamports)]).buffer),
          ]),
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);

      return true;
    } catch (err) {
      console.error('Error staking:', err);
      return false;
    }
  }, [connected, publicKey, connection, stakePoolPda, sendTransaction]);

  const unstake = useCallback(async (amount: number) => {
    if (!connected || !publicKey || !stakePoolPda) {
      throw new Error('Please connect your wallet first');
    }

    try {
      const lamports = amount * LAMPORTS_PER_SOL;
      const transaction = new Transaction();

      transaction.add(
        new TransactionInstruction({
          keys: [
            { pubkey: stakePoolPda, isSigner: false, isWritable: true },
            { pubkey: publicKey, isSigner: true, isWritable: true },
          ],
          programId: new PublicKey(STAKE_POOL_PROGRAM_ID),
          data: Buffer.from([
            INSTRUCTION_INDEX.UNSTAKE,
            ...new Uint8Array(new BigUint64Array([BigInt(lamports)]).buffer),
          ]),
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);

      return true;
    } catch (err) {
      console.error('Error unstaking:', err);
      return false;
    }
  }, [connected, publicKey, connection, stakePoolPda, sendTransaction]);

  const processBNPLTransaction = useCallback(async (amount: number) => {
    if (!connected || !publicKey || !stakePoolPda) {
      throw new Error('Please connect your wallet first');
    }

    try {
      const lamports = amount * LAMPORTS_PER_SOL;
      const transaction = new Transaction();

      transaction.add(
        new TransactionInstruction({
          keys: [
            { pubkey: stakePoolPda, isSigner: false, isWritable: true },
            { pubkey: publicKey, isSigner: true, isWritable: true },
          ],
          programId: new PublicKey(STAKE_POOL_PROGRAM_ID),
          data: Buffer.from([
            INSTRUCTION_INDEX.PROCESS_BNPL,
            ...new Uint8Array(new BigUint64Array([BigInt(lamports)]).buffer),
          ]),
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);

      return true;
    } catch (err) {
      console.error('Error processing BNPL transaction:', err);
      return false;
    }
  }, [connected, publicKey, connection, stakePoolPda, sendTransaction]);

  const linkCard = useCallback(async (cardNumber: string, expiryDate: string, cvv: string) => {
    if (!connected || !publicKey || !stakePoolPda) {
      throw new Error('Please connect your wallet first');
    }

    try {
      const transaction = new Transaction();

      // Convert card details to buffer
      const cardData = Buffer.from(JSON.stringify({
        cardNumber,
        expiryDate,
        cvv,
      }));

      transaction.add(
        new TransactionInstruction({
          keys: [
            { pubkey: stakePoolPda, isSigner: false, isWritable: true },
            { pubkey: publicKey, isSigner: true, isWritable: true },
          ],
          programId: new PublicKey(STAKE_POOL_PROGRAM_ID),
          data: Buffer.from([
            INSTRUCTION_INDEX.LINK_CARD,
            ...cardData,
          ]),
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);

      return true;
    } catch (err) {
      console.error('Error linking card:', err);
      return false;
    }
  }, [connected, publicKey, connection, stakePoolPda, sendTransaction]);

  const unlinkCard = useCallback(async () => {
    if (!connected || !publicKey || !stakePoolPda) {
      throw new Error('Please connect your wallet first');
    }

    try {
      const transaction = new Transaction();

      transaction.add(
        new TransactionInstruction({
          keys: [
            { pubkey: stakePoolPda, isSigner: false, isWritable: true },
            { pubkey: publicKey, isSigner: true, isWritable: true },
          ],
          programId: new PublicKey(STAKE_POOL_PROGRAM_ID),
          data: Buffer.from([INSTRUCTION_INDEX.UNLINK_CARD]),
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);

      return true;
    } catch (err) {
      console.error('Error unlinking card:', err);
      return false;
    }
  }, [connected, publicKey, connection, stakePoolPda, sendTransaction]);

  return {
    loading,
    error,
    getStakeInfo,
    initializeStakePool,
    stake,
    unstake,
    processBNPLTransaction,
    linkCard,
    unlinkCard,
  };
}
