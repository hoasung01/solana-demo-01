import { Connection, PublicKey } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';

export interface MarinadeState {
  msolMint: PublicKey;
  msolMintAuthority: PublicKey;
  adminAuthority: PublicKey;
  operationalSolAccount: PublicKey;
  treasuryMsolAccount: PublicKey;
  reserveBumpSeed: number;
  msolMintBumpSeed: number;
  rentExemptForTokenAcc: BN;
  rentExemptForMinStake: BN;
  minStake: BN;
  minDeposit: BN;
  minWithdraw: BN;
  stakingSolCap: BN;
  liquiditySolCap: BN;
  warmupCooldownRate: BN;
  slashingPenalty: BN;
  lastEpochPoolTokenSupply: BN;
  lastEpochTotalLamports: BN;
  lastEpoch: BN;
  validatorSystem: {
    validatorList: PublicKey;
    managerAuthority: PublicKey;
    totalValidatorScore: BN;
    totalActiveBalance: BN;
    autoAddValidatorEnabled: number;
  };
  stakeSystem: {
    stakeList: PublicKey;
    delayedUnstakeCoolingDown: BN;
    stakeDepositBumpSeed: number;
    stakeWithdrawBumpSeed: number;
    slotsForStakeDelta: BN;
    lastStakeDeltaEpoch: BN;
    minStakeDelta: BN;
  };
  delayedUnstake: {
    msolMint: PublicKey;
    reservePda: PublicKey;
    reserveBumpSeed: number;
    msolMintBumpSeed: number;
    lastEpochPoolTokenSupply: BN;
    lastEpochTotalLamports: BN;
    lastEpoch: BN;
  };
}

export const getMarinadeState = async (
  connection: Connection,
  stateAddress: PublicKey
): Promise<MarinadeState> => {
  const accountInfo = await connection.getAccountInfo(stateAddress);
  if (!accountInfo) {
    throw new Error('Marinade state account not found');
  }

  // Parse the account data according to Marinade's state structure
  // This is a simplified version - you'll need to implement the actual parsing
  // based on Marinade's account structure
  return {
    msolMint: new PublicKey(accountInfo.data.slice(8, 40)),
    msolMintAuthority: new PublicKey(accountInfo.data.slice(40, 72)),
    adminAuthority: new PublicKey(accountInfo.data.slice(72, 104)),
    operationalSolAccount: new PublicKey(accountInfo.data.slice(104, 136)),
    treasuryMsolAccount: new PublicKey(accountInfo.data.slice(136, 168)),
    reserveBumpSeed: accountInfo.data[168],
    msolMintBumpSeed: accountInfo.data[169],
    rentExemptForTokenAcc: new BN(accountInfo.data.slice(170, 178)),
    rentExemptForMinStake: new BN(accountInfo.data.slice(178, 186)),
    minStake: new BN(accountInfo.data.slice(186, 194)),
    minDeposit: new BN(accountInfo.data.slice(194, 202)),
    minWithdraw: new BN(accountInfo.data.slice(202, 210)),
    stakingSolCap: new BN(accountInfo.data.slice(210, 218)),
    liquiditySolCap: new BN(accountInfo.data.slice(218, 226)),
    warmupCooldownRate: new BN(accountInfo.data.slice(226, 234)),
    slashingPenalty: new BN(accountInfo.data.slice(234, 242)),
    lastEpochPoolTokenSupply: new BN(accountInfo.data.slice(242, 250)),
    lastEpochTotalLamports: new BN(accountInfo.data.slice(250, 258)),
    lastEpoch: new BN(accountInfo.data.slice(258, 266)),
    validatorSystem: {
      validatorList: new PublicKey(accountInfo.data.slice(266, 298)),
      managerAuthority: new PublicKey(accountInfo.data.slice(298, 330)),
      totalValidatorScore: new BN(accountInfo.data.slice(330, 338)),
      totalActiveBalance: new BN(accountInfo.data.slice(338, 346)),
      autoAddValidatorEnabled: accountInfo.data[346],
    },
    stakeSystem: {
      stakeList: new PublicKey(accountInfo.data.slice(347, 379)),
      delayedUnstakeCoolingDown: new BN(accountInfo.data.slice(379, 387)),
      stakeDepositBumpSeed: accountInfo.data[387],
      stakeWithdrawBumpSeed: accountInfo.data[388],
      slotsForStakeDelta: new BN(accountInfo.data.slice(389, 397)),
      lastStakeDeltaEpoch: new BN(accountInfo.data.slice(397, 405)),
      minStakeDelta: new BN(accountInfo.data.slice(405, 413)),
    },
    delayedUnstake: {
      msolMint: new PublicKey(accountInfo.data.slice(413, 445)),
      reservePda: new PublicKey(accountInfo.data.slice(445, 477)),
      reserveBumpSeed: accountInfo.data[477],
      msolMintBumpSeed: accountInfo.data[478],
      lastEpochPoolTokenSupply: new BN(accountInfo.data.slice(479, 487)),
      lastEpochTotalLamports: new BN(accountInfo.data.slice(487, 495)),
      lastEpoch: new BN(accountInfo.data.slice(495, 503)),
    },
  };
};
