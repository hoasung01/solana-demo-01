// Program ID for the stake pool program
export const STAKE_POOL_PROGRAM_ID = 'AH6kLi3PTnRqEqFpNELtBPgnyhdZZSeMeowqPK9aGQ4W';

// Minimum stake amount in SOL
export const MIN_STAKE_AMOUNT = 0.1;

// Maximum stake amount in SOL
export const MAX_STAKE_AMOUNT = 1000;

// Stake Pool Constants
export const STAKE_FEE_PERCENTAGE = 1; // 1% fee on staking

// BNPL Constants
export const CREDIT_LIMIT_PERCENTAGE = 50; // 50% of staked amount as credit limit
export const MIN_CREDIT_LIMIT = 1; // Minimum credit limit in SOL
export const MAX_CREDIT_LIMIT = 500; // Maximum credit limit in SOL
export const BNPL_FEE_PERCENTAGE = 2; // 2% fee on BNPL transactions

// Transaction Constants
export const DEFAULT_COMMITMENT = 'confirmed';
export const TRANSACTION_TIMEOUT = 60000; // 60 seconds

// UI Constants
export const TOAST_DURATION = 5000; // 5 seconds
export const REFRESH_INTERVAL = 10000; // 10 seconds

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet',
  INVALID_AMOUNT: 'Please enter a valid amount',
  MIN_STAKE_AMOUNT: `Minimum stake amount is ${MIN_STAKE_AMOUNT} SOL`,
  MAX_STAKE_AMOUNT: `Maximum stake amount is ${MAX_STAKE_AMOUNT} SOL`,
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  STAKE_FAILED: 'Failed to stake',
  UNSTAKE_FAILED: 'Failed to unstake',
  PROGRAM_ERROR: 'Program error occurred',
} as const;
