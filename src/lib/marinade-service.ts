import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Marinade, getMSolMintAddress } from '@marinade.finance/marinade-ts-sdk';

export class MarinadeService {
  private connection: Connection;
  private marinade: Marinade;

  constructor(connection: Connection) {
    this.connection = connection;
    this.marinade = new Marinade(connection);
  }

  async getStakingInfo(walletAddress: PublicKey) {
    try {
      // Get mSOL balance
      const mSolBalance = await this.connection.getTokenAccountBalance(
        await this.marinade.getMSolTokenAccountAddress(walletAddress)
      );

      // Get APY
      const apy = await this.marinade.getAPY();

      // Get staking duration
      const stakingDuration = await this.marinade.getStakingDuration(walletAddress);

      // Get total rewards
      const totalRewards = await this.marinade.getTotalRewards(walletAddress);

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

  // Add methods for staking operations
  async stakeSol(walletAddress: PublicKey, amount: number) {
    try {
      const stakeInstruction = await this.marinade.deposit(amount * LAMPORTS_PER_SOL);
      return stakeInstruction;
    } catch (error) {
      console.error('Error creating stake instruction:', error);
      throw error;
    }
  }

  async unstakeSol(walletAddress: PublicKey, amount: number) {
    try {
      const unstakeInstruction = await this.marinade.liquidUnstake(amount * LAMPORTS_PER_SOL);
      return unstakeInstruction;
    } catch (error) {
      console.error('Error creating unstake instruction:', error);
      throw error;
    }
  }
}
