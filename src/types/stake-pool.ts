import { PublicKey } from '@solana/web3.js';

export interface StakePoolInfo {
  totalStaked: number;
  rewardRate: number;
  lastUpdateTime: number;
  authority: PublicKey;
  creditLimit: number;
  usedCredit: number;
  linkedCards: {
    id: string;
    lastFour: string;
  }[];
}

export interface StakePoolProgram {
  initialize: () => Promise<void>;
  stake: (amount: number) => Promise<void>;
  unstake: (amount: number) => Promise<void>;
  claimRewards: () => Promise<void>;
  linkCard: (cardNumber: string, expiryDate: string, cvv: string) => Promise<void>;
  unlinkCard: () => Promise<void>;
  processBnplTransaction: (amount: number) => Promise<void>;
}
