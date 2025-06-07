import { renderHook, act } from '@testing-library/react';
import { useStakePool } from '../use-stake-pool';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program } from '@project-serum/anchor';
import { BN } from 'bn.js';
import { web3 } from '@project-serum/anchor';

// Mock the wallet adapter hooks
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: jest.fn(),
  useConnection: jest.fn(),
}));

// Mock the Anchor Program
jest.mock('@project-serum/anchor', () => ({
  Program: jest.fn(),
  web3: {
    PublicKey: jest.fn(),
    LAMPORTS_PER_SOL: 1e9,
    findProgramAddressSync: jest.fn(),
  },
}));

describe('useStakePool', () => {
  const mockPublicKey = 'mock-public-key';
  const mockProgram = {
    methods: {
      linkCard: jest.fn(),
      unlinkCard: jest.fn(),
      processBnplTransaction: jest.fn(),
    },
    account: {
      stakePool: {
        fetch: jest.fn(),
      },
    },
    provider: {
      sendAndConfirm: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useWallet as jest.Mock).mockReturnValue({
      publicKey: mockPublicKey,
      connected: true,
    });
    (useConnection as jest.Mock).mockReturnValue({
      connection: {},
    });
    (Program as jest.Mock).mockReturnValue(mockProgram);
    (web3.PublicKey.findProgramAddressSync as jest.Mock).mockReturnValue(['mock-pda']);
  });

  it('should initialize program when wallet is connected', async () => {
    const { result } = renderHook(() => useStakePool());

    expect(result.current.program).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle program initialization error', async () => {
    const error = new Error('Initialization failed');
    (Program as jest.Mock).mockImplementation(() => {
      throw error;
    });

    const { result } = renderHook(() => useStakePool());

    expect(result.current.program).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(error.message);
  });

  it('should fetch stake info successfully', async () => {
    const mockStakeInfo = {
      authority: 'mock-authority',
      totalStaked: new BN(1000),
      linkedCards: [],
      creditLimit: new BN(300),
      usedCredit: new BN(100),
    };

    mockProgram.account.stakePool.fetch.mockResolvedValue(mockStakeInfo);

    const { result } = renderHook(() => useStakePool());

    let stakeInfo;
    await act(async () => {
      stakeInfo = await result.current.getStakeInfo();
    });

    expect(stakeInfo).toEqual(mockStakeInfo);
    expect(mockProgram.account.stakePool.fetch).toHaveBeenCalledWith('mock-pda');
  });

  it('should handle stake info fetch error', async () => {
    const error = new Error('Fetch failed');
    mockProgram.account.stakePool.fetch.mockRejectedValue(error);

    const { result } = renderHook(() => useStakePool());

    let stakeInfo;
    await act(async () => {
      stakeInfo = await result.current.getStakeInfo();
    });

    expect(stakeInfo).toBeNull();
  });

  it('should link card successfully', async () => {
    const cardId = 'test-card-id';
    mockProgram.methods.linkCard.mockResolvedValue(undefined);

    const { result } = renderHook(() => useStakePool());

    let success;
    await act(async () => {
      success = await result.current.linkCard(cardId);
    });

    expect(success).toBe(true);
    expect(mockProgram.methods.linkCard).toHaveBeenCalledWith(cardId);
  });

  it('should handle card linking error', async () => {
    const cardId = 'test-card-id';
    const error = new Error('Link failed');
    mockProgram.methods.linkCard.mockRejectedValue(error);

    const { result } = renderHook(() => useStakePool());

    let success;
    await act(async () => {
      success = await result.current.linkCard(cardId);
    });

    expect(success).toBe(false);
  });

  it('should process BNPL transaction successfully', async () => {
    const amount = 1.5;
    mockProgram.methods.processBnplTransaction.mockResolvedValue(undefined);

    const { result } = renderHook(() => useStakePool());

    let success;
    await act(async () => {
      success = await result.current.processBNPLTransaction(amount);
    });

    expect(success).toBe(true);
    expect(mockProgram.methods.processBnplTransaction).toHaveBeenCalledWith(
      expect.any(BN)
    );
  });

  it('should handle BNPL transaction error', async () => {
    const amount = 1.5;
    const error = new Error('Transaction failed');
    mockProgram.methods.processBnplTransaction.mockRejectedValue(error);

    const { result } = renderHook(() => useStakePool());

    let success;
    await act(async () => {
      success = await result.current.processBNPLTransaction(amount);
    });

    expect(success).toBe(false);
  });
});
