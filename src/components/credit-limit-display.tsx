import { useStakePool } from '@/hooks/use-stake-pool';
import { CREDIT_LIMIT_PERCENTAGE } from '@/lib/constants';

interface CreditLimitInfo {
  totalLimit: number;
  usedAmount: number;
  availableAmount: number;
}

// ... existing code ...
