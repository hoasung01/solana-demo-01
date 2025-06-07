import { useStakePool } from '@/hooks/use-stake-pool';
import { CREDIT_LIMIT_PERCENTAGE } from '@/lib/constants';
import BN from 'bn.js';
import type { BN as BNType } from 'bn.js';

interface CreditLimitInfo {
  totalLimit: BNType;
  usedAmount: BNType;
  availableAmount: BNType;
}

// ... existing code ...
