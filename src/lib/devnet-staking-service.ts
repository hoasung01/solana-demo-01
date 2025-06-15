import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token';

export class DevnetStakingService {
  private connection: Connection;
  private mSolMint: PublicKey | null = null;
  private readonly STAKE_RATE = 1.05; // 5% APY

  constructor(connection: Connection) {
    this.connection = connection;
  }

  async initializeMSolMint(admin: PublicKey): Promise<PublicKey> {
    if (this.mSolMint) return this.mSolMint;

    const mSolMint = await createMint(
      this.connection,
      admin,
      admin,
      null,
      9
    );

    this.mSolMint = mSolMint;
    return mSolMint;
  }

  async getMSolBalance(walletAddress: PublicKey) {
    if (!this.mSolMint) return 0;

    try {
      const tokenAccount = await this.getOrCreateAssociatedTokenAccount(walletAddress);
      const balance = await this.connection.getTokenAccountBalance(tokenAccount);
      return Number(balance.value.amount) / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting mSOL balance:', error);
      return 0;
    }
  }

  private async getOrCreateAssociatedTokenAccount(walletAddress: PublicKey) {
    if (!this.mSolMint) throw new Error('mSOL mint not initialized');

    const associatedTokenAddress = await getOrCreateAssociatedTokenAccount(
      this.connection,
      walletAddress,
      this.mSolMint,
      walletAddress
    );

    return associatedTokenAddress;
  }

  async stakeSol(
    user: PublicKey,
    amount: number
  ): Promise<{ signature: string; mSolAmount: number }> {
    if (!this.mSolMint) {
      throw new Error('mSOL mint not initialized');
    }

    const userTokenAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      user,
      this.mSolMint,
      user
    );

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: user,
        toPubkey: this.mSolMint,
        lamports: amount * LAMPORTS_PER_SOL,
      }),
      mintTo(
        this.connection,
        user,
        this.mSolMint,
        user,
        user,
        amount * LAMPORTS_PER_SOL
      )
    );

    const signature = await this.connection.sendTransaction(transaction, [user]);
    await this.connection.confirmTransaction(signature);

    return {
      signature,
      mSolAmount: amount,
    };
  }

  async unstakeSol(
    user: PublicKey,
    mSolAmount: number
  ): Promise<{ signature: string; solAmount: number }> {
    if (!this.mSolMint) {
      throw new Error('mSOL mint not initialized');
    }

    const userTokenAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      user,
      this.mSolMint,
      user
    );

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: this.mSolMint,
        toPubkey: user,
        lamports: mSolAmount * LAMPORTS_PER_SOL,
      })
    );

    const signature = await this.connection.sendTransaction(transaction, [user]);
    await this.connection.confirmTransaction(signature);

    return {
      signature,
      solAmount: mSolAmount,
    };
  }

  async getStakingInfo(user: PublicKey) {
    if (!this.mSolMint) {
      throw new Error('mSOL mint not initialized');
    }

    const userTokenAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      user,
      this.mSolMint,
      user
    );

    const balance = await this.connection.getTokenAccountBalance(userTokenAccount);
    const solBalance = await this.connection.getBalance(user);

    return {
      mSolBalance: Number(balance.value.amount) / LAMPORTS_PER_SOL,
      solBalance: solBalance / LAMPORTS_PER_SOL,
      apy: this.STAKE_RATE * 100 - 100, // Convert to percentage
      stakingDuration: '0 days', // You might want to track this
      totalRewards: 0, // You might want to track this
    };
  }
}
