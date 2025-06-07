import { useStakePool } from '@/hooks/use-stake-pool';
import { CREDIT_LIMIT_PERCENTAGE } from '@/lib/constants';
import BN from 'bn.js';

interface CreditLimitInfo {
  totalLimit: BN;
  usedAmount: BN;
  availableAmount: BN;
}

// ... existing code ...
