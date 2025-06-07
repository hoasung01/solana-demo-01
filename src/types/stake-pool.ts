import { BN } from 'bn.js';
import { PublicKey } from '@solana/web3.js';

export interface CreditCard {
  id: string;
  status: 'linked' | 'unlinked';
}

export interface StakePool {
  authority: PublicKey;
  totalStaked: BN;
  linkedCards: CreditCard[];
  creditLimit: BN;
  usedCredit: BN;
}

export interface StakePoolProgram {
  programId: PublicKey;
  account: {
    stakePool: StakePool;
  };
  methods: {
    stake: (amount: BN) => Promise<void>;
    unstake: (amount: BN) => Promise<void>;
    linkCard: (cardId: string) => Promise<void>;
    unlinkCard: (cardId: string) => Promise<void>;
    processBnplTransaction: (amount: BN) => Promise<void>;
  };
}
