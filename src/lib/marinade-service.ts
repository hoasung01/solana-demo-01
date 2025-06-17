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
      const state = await marinade.getMarinadeState();

      console.log("Marinade state:", state);

      return {
        totalStaked: state.state.totalLamportsUnderManagement ? state.state.totalLamportsUnderManagement.toNumber() / 1e9 : 0,
        totalStakers: state.state.totalStakers ? state.state.totalStakers.toNumber() : 0,
        msolPrice: state.state.msolPrice ? state.state.msolPrice.toNumber() / 1e9 : 0,
        msolSupply: state.state.msolSupply ? state.state.msolSupply.toNumber() / 1e9 : 0,
      };
    } catch (error) {
      console.error("Error getting staking stats:", error);
      return {
        totalStaked: 0,
        totalStakers: 0,
        msolPrice: 0,
        msolSupply: 0,
      };
    }
  }

  async getMSolBalance(wallet: WalletAdapter) {
    try {
      console.log("Getting mSOL balance for wallet:", wallet.publicKey.toBase58());

      const marinade = await this.getMarinade(wallet);
      const state = await marinade.getMarinadeState();

      console.log("Marinade state:", state);

      // Access mSOL mint from the state object
      const msolMint = state.state.msolMint;

      if (!msolMint) {
        console.log("No mSOL mint found in Marinade state");
        return 0;
      }

      console.log("mSOL mint address:", msolMint.toBase58());

      const tokenAccounts = await this.connection.getTokenAccountsByOwner(
        wallet.publicKey,
        { mint: msolMint }
      );

      console.log("Found token accounts:", tokenAccounts.value.length);

      if (tokenAccounts.value.length === 0) {
        console.log("No mSOL token account found for wallet");
        return 0;
      }

      console.log("Token account address:", tokenAccounts.value[0].pubkey.toBase58());

      const balance = await this.connection.getTokenAccountBalance(
        tokenAccounts.value[0].pubkey
      );

      console.log("Raw balance data:", balance);
      return balance.value.uiAmount || 0;
    } catch (error) {
      console.error("Error getting mSOL balance:", error);
      return 0; // Return 0 instead of throwing error
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
      console.log("Marinade instance created");

      const { transaction } = await marinade.deposit(new BN(amount * 1e9));
      console.log("Deposit transaction created");

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      console.log("Transaction created, signing...");
      const signedTx = await wallet.signTransaction(transaction);
      console.log("Transaction signed, sending...");

      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      console.log("Transaction sent, signature:", signature);

      // Wait for confirmation with timeout
      const confirmation = await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

      console.log("Transaction confirmed:", confirmation);

      // Wait a bit for the token account to be created
      console.log("Waiting for token account creation...");
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Verify mSOL balance
      console.log("Checking mSOL balance...");
      const msolBalance = await this.getMSolBalance(wallet);
      console.log("mSOL balance after staking:", msolBalance);

      if (msolBalance === 0) {
        console.warn("mSOL balance is still 0 after staking. This might be due to delayed token account creation.");

        // Try to get the token account address that should have been created
        const marinadeState = await marinade.getMarinadeState();
        if (marinadeState && marinadeState.state.msolMint) {
          const msolMint = marinadeState.state.msolMint;
          console.log("mSOL mint address:", msolMint.toBase58());

          const tokenAccounts = await this.connection.getTokenAccountsByOwner(
            wallet.publicKey,
            { mint: msolMint }
          );
          console.log("Token accounts found:", tokenAccounts.value.length);

          if (tokenAccounts.value.length > 0) {
            console.log("Token account address:", tokenAccounts.value[0].pubkey.toBase58());
          }
        } else {
          console.log("Could not get mSOL mint address from Marinade state");
        }
      }

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
