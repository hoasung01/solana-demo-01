import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token';

const MSOL_MINT_ADDRESS = new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So");

interface WalletAdapter {
  publicKey: PublicKey;
  sendTransaction: (transaction: Transaction, connection: Connection) => Promise<string>;
}

export class DevnetStakingService {
  private connection: Connection;
  private mSolMint: PublicKey | null = null;
  private readonly STAKE_RATE = 1.05; // 5% APY

  constructor(connection: Connection) {
    this.connection = connection;
  }

  async initializeMSolMint(wallet: WalletAdapter): Promise<PublicKey> {
    try {
      // Create mSOL mint if it doesn't exist
      const mint = await createMint(
        this.connection,
        wallet.publicKey,
        wallet.publicKey,
        wallet.publicKey,
        9 // 9 decimals like SOL
      );

      // Create associated token account for the user
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        wallet.publicKey,
        mint,
        wallet.publicKey
      );

      this.mSolMint = mint;
      return mint;
    } catch (error) {
      console.error("Error initializing mSOL mint:", error);
      throw error;
    }
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

  async stakeSol(wallet: WalletAdapter, amount: number): Promise<string> {
    try {
      const transaction = new Transaction();

      // Create mSOL mint if it doesn't exist
      const mint = await this.initializeMSolMint(wallet);

      // Create associated token account for the user if it doesn't exist
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        wallet.publicKey,
        mint,
        wallet.publicKey
      );

      // Add transfer instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: mint,
          lamports: amount * LAMPORTS_PER_SOL,
        })
      );

      // Add mint instruction to mint mSOL tokens
      transaction.add(
        mintTo(
          this.connection,
          wallet.publicKey,
          mint,
          tokenAccount.address,
          wallet.publicKey,
          amount * LAMPORTS_PER_SOL
        )
      );

      // Send and confirm transaction
      const signature = await wallet.sendTransaction(transaction, this.connection);
      await this.connection.confirmTransaction(signature);

      return signature;
    } catch (error) {
      console.error("Error staking SOL:", error);
      throw error;
    }
  }

  async unstakeSol(wallet: WalletAdapter, amount: number): Promise<string> {
    try {
      const transaction = new Transaction();

      // Get mSOL mint
      const mint = await this.initializeMSolMint(wallet);

      // Get user's mSOL token account
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        wallet.publicKey,
        mint,
        wallet.publicKey
      );

      // Add burn instruction to burn mSOL tokens
      transaction.add(
        mintTo(
          this.connection,
          wallet.publicKey,
          mint,
          tokenAccount.address,
          wallet.publicKey,
          -amount * LAMPORTS_PER_SOL
        )
      );

      // Add transfer instruction to return SOL
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: mint,
          toPubkey: wallet.publicKey,
          lamports: amount * LAMPORTS_PER_SOL,
        })
      );

      // Send and confirm transaction
      const signature = await wallet.sendTransaction(transaction, this.connection);
      await this.connection.confirmTransaction(signature);

      return signature;
    } catch (error) {
      console.error("Error unstaking SOL:", error);
      throw error;
    }
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
