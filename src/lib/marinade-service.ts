import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, Keypair, VersionedTransaction } from '@solana/web3.js';
import { Marinade, MarinadeConfig, Wallet } from '@marinade.finance/marinade-ts-sdk';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from "@coral-xyz/anchor";

const MARINADE_STATE_ADDRESS = new PublicKey("8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC");
const MSOL_MINT_ADDRESS = new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So");

interface WalletAdapter {
  publicKey: PublicKey;
  signTransaction: (transaction: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>;
  signAllTransactions: (transactions: (Transaction | VersionedTransaction)[]) => Promise<(Transaction | VersionedTransaction)[]>;
  sendTransaction: (transaction: Transaction | VersionedTransaction, connection: Connection) => Promise<string>;
}

export class MarinadeService {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  private async getMarinade(wallet: WalletAdapter): Promise<Marinade> {
    console.log("Getting Marinade instance with wallet:", {
      publicKey: wallet.publicKey.toBase58(),
      signTransaction: !!wallet.signTransaction,
      signAllTransactions: !!wallet.signAllTransactions,
      sendTransaction: !!wallet.sendTransaction
    });

    const config = new MarinadeConfig({
      connection: this.connection,
      publicKey: wallet.publicKey,
    });

    return new Marinade(config);
  }

  private formatApy(apy: number | undefined): string {
    if (apy === undefined || isNaN(apy)) {
      return "0.00";
    }
    return apy.toFixed(2);
  }

  async getStakingInfo(walletAddress: PublicKey) {
    try {
      // Get mSOL balance
      const mSolBalance = await this.connection.getTokenAccountBalance(
        await this.getMarinade(walletAddress).getMSolTokenAccountAddress(walletAddress)
      );

      // Get APY
      const apy = await this.getMarinade(walletAddress).getAPY();

      // Get staking duration
      const stakingDuration = await this.getMarinade(walletAddress).getStakingDuration(walletAddress);

      // Get total rewards
      const totalRewards = await this.getMarinade(walletAddress).getTotalRewards(walletAddress);

      return {
        mSolBalance: mSolBalance.value.uiAmount || 0,
        apy: apy * 100, // Convert to percentage
        stakingDuration: stakingDuration,
        totalRewards: totalRewards / LAMPORTS_PER_SOL, // Convert to SOL
      };
    } catch (error) {
      console.error('Error fetching Marinade staking info:', error);
      return {
        mSolBalance: 0,
        apy: 0,
        stakingDuration: '0 days',
        totalRewards: 0,
      };
    }
  }

  async getRecentTransactions(walletAddress: PublicKey) {
    try {
      const signatures = await this.connection.getSignaturesForAddress(
        walletAddress,
        { limit: 5 }
      );

      return signatures.map(sig => ({
        type: 'Transaction',
        date: new Date(sig.blockTime! * 1000).toLocaleDateString(),
        amount: '0', // You might want to parse the actual amount from the transaction
      }));
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      return [];
    }
  }

  async getStakingStats(wallet: WalletAdapter) {
    try {
      const marinade = await this.getMarinade(wallet);
      const state = await marinade.getState();

      return {
        totalStaked: state.totalStaked.toNumber() / 1e9,
        totalStakers: state.totalStakers.toNumber(),
        msolPrice: state.msolPrice.toNumber() / 1e9,
        msolSupply: state.msolSupply.toNumber() / 1e9,
      };
    } catch (error) {
      console.error("Error getting staking stats:", error);
      throw error;
    }
  }

  async getMSolBalance(wallet: WalletAdapter) {
    try {
      const marinade = await this.getMarinade(wallet);
      const state = await marinade.getState();
      const msolMint = state.msolMint;

      const tokenAccounts = await this.connection.getTokenAccountsByOwner(
        wallet.publicKey,
        { mint: msolMint }
      );

      if (tokenAccounts.value.length === 0) {
        return 0;
      }

      const balance = await this.connection.getTokenAccountBalance(
        tokenAccounts.value[0].pubkey
      );

      return balance.value.uiAmount || 0;
    } catch (error) {
      console.error("Error getting mSOL balance:", error);
      throw error;
    }
  }

  async stakeSol(wallet: WalletAdapter, amount: number) {
    try {
      console.log("Staking SOL with amount:", amount);
      console.log("Wallet details:", {
        publicKey: wallet.publicKey.toBase58(),
        signTransaction: !!wallet.signTransaction,
        signAllTransactions: !!wallet.signAllTransactions,
        sendTransaction: !!wallet.sendTransaction
      });

      const marinade = await this.getMarinade(wallet);
      const { transaction } = await marinade.deposit(new BN(amount * 1e9));

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      console.log("Transaction created, signing...");
      const signedTx = await wallet.signTransaction(transaction);
      console.log("Transaction signed, sending...");

      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      console.log("Transaction sent, signature:", signature);

      const confirmation = await this.connection.confirmTransaction(signature);
      console.log("Transaction confirmed:", confirmation);

      return signature;
    } catch (error) {
      console.error("Error staking SOL:", error);
      throw error;
    }
  }

  async unstakeSol(wallet: WalletAdapter, amount: number) {
    try {
      console.log("Unstaking SOL with amount:", amount);
      console.log("Wallet details:", {
        publicKey: wallet.publicKey.toBase58(),
        signTransaction: !!wallet.signTransaction,
        signAllTransactions: !!wallet.signAllTransactions,
        sendTransaction: !!wallet.sendTransaction
      });

      const marinade = await this.getMarinade(wallet);
      const { transaction } = await marinade.liquidUnstake(new BN(amount * 1e9));

      console.log("Transaction created, signing...");
      const signedTx = await wallet.signTransaction(transaction);
      console.log("Transaction signed, sending...");

      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      console.log("Transaction sent, signature:", signature);

      const confirmation = await this.connection.confirmTransaction(signature);
      console.log("Transaction confirmed:", confirmation);

      return signature;
    } catch (error) {
      console.error("Error unstaking SOL:", error);
      throw error;
    }
  }
}
