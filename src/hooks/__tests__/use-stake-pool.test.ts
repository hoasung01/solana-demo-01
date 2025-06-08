import { renderHook, act } from '@testing-library/react';
import { useStakePool } from '../use-stake-pool';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

// Mock the hooks
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: jest.fn(),
  useConnection: jest.fn(),
}));

describe('useStakePool', () => {
  const mockPublicKey = new PublicKey('11111111111111111111111111111111');
  const mockConnection = {
    getAccountInfo: jest.fn(),
    confirmTransaction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useWallet as jest.Mock).mockReturnValue({
      publicKey: mockPublicKey,
      connected: true,
      sendTransaction: jest.fn(),
    });
    (useConnection as jest.Mock).mockReturnValue({
      connection: mockConnection,
    });
  });

  it('should initialize stake pool successfully', async () => {
    const { result } = renderHook(() => useStakePool());

    let success;
    await act(async () => {
      success = await result.current.initializeStakePool();
    });

    expect(success).toBe(true);
    expect(mockConnection.confirmTransaction).toHaveBeenCalled();
  });

  it('should handle initialization error', async () => {
    const error = new Error('Failed to initialize');
    mockConnection.confirmTransaction.mockRejectedValue(error);

    const { result } = renderHook(() => useStakePool());

    let success;
    await act(async () => {
      success = await result.current.initializeStakePool();
    });

    expect(success).toBe(false);
  });

  it('should get stake info successfully', async () => {
    const mockAccountInfo = {
      data: Buffer.from([
        // totalStaked: 1000 SOL
        ...new Uint8Array(new BigUint64Array([BigInt(1000 * 1e9)]).buffer),
        // rewardRate: 0.1 SOL
        ...new Uint8Array(new BigUint64Array([BigInt(0.1 * 1e9)]).buffer),
        // lastUpdateTime: 1234567890
        ...new Uint8Array(new BigUint64Array([BigInt(1234567890)]).buffer),
        // authority: mockPublicKey
        ...mockPublicKey.toBytes(),
      ]),
    };

    mockConnection.getAccountInfo.mockResolvedValue(mockAccountInfo);

    const { result } = renderHook(() => useStakePool());

    let stakeInfo;
    await act(async () => {
      stakeInfo = await result.current.getStakeInfo();
    });

    expect(stakeInfo).toEqual({
      totalStaked: 1000,
      rewardRate: 0.1,
      lastUpdateTime: 1234567890,
      authority: mockPublicKey,
      creditLimit: 300, // 30% of totalStaked
      usedCredit: 0,
      linkedCards: [],
    });
  });

  it('should handle get stake info error', async () => {
    const error = new Error('Failed to get account info');
    mockConnection.getAccountInfo.mockRejectedValue(error);

    const { result } = renderHook(() => useStakePool());

    let stakeInfo;
    await act(async () => {
      stakeInfo = await result.current.getStakeInfo();
    });

    expect(stakeInfo).toBeNull();
  });

  it('should stake successfully', async () => {
    const { result } = renderHook(() => useStakePool());

    let success;
    await act(async () => {
      success = await result.current.stake(1); // Stake 1 SOL
    });

    expect(success).toBe(true);
    expect(mockConnection.confirmTransaction).toHaveBeenCalled();
  });

  it('should handle stake error', async () => {
    const error = new Error('Failed to stake');
    mockConnection.confirmTransaction.mockRejectedValue(error);

    const { result } = renderHook(() => useStakePool());

    let success;
    await act(async () => {
      success = await result.current.stake(1);
    });

    expect(success).toBe(false);
  });

  it('should unstake successfully', async () => {
    const { result } = renderHook(() => useStakePool());

    let success;
    await act(async () => {
      success = await result.current.unstake(1); // Unstake 1 SOL
    });

    expect(success).toBe(true);
    expect(mockConnection.confirmTransaction).toHaveBeenCalled();
  });

  it('should handle unstake error', async () => {
    const error = new Error('Failed to unstake');
    mockConnection.confirmTransaction.mockRejectedValue(error);

    const { result } = renderHook(() => useStakePool());

    let success;
    await act(async () => {
      success = await result.current.unstake(1);
    });

    expect(success).toBe(false);
  });

  it('should process BNPL transaction successfully', async () => {
    const { result } = renderHook(() => useStakePool());

    let success;
    await act(async () => {
      success = await result.current.processBNPLTransaction(1); // Process 1 SOL BNPL
    });

    expect(success).toBe(true);
    expect(mockConnection.confirmTransaction).toHaveBeenCalled();
  });

  it('should handle BNPL transaction error', async () => {
    const error = new Error('Failed to process BNPL transaction');
    mockConnection.confirmTransaction.mockRejectedValue(error);

    const { result } = renderHook(() => useStakePool());

    let success;
    await act(async () => {
      success = await result.current.processBNPLTransaction(1);
    });

    expect(success).toBe(false);
  });

  it('should link card successfully', async () => {
    const { result } = renderHook(() => useStakePool());

    let success;
    await act(async () => {
      success = await result.current.linkCard('1234567890123456', '12/25', '123');
    });

    expect(success).toBe(true);
    expect(mockConnection.confirmTransaction).toHaveBeenCalled();
  });

  it('should handle link card error', async () => {
    const error = new Error('Failed to link card');
    mockConnection.confirmTransaction.mockRejectedValue(error);

    const { result } = renderHook(() => useStakePool());

    let success;
    await act(async () => {
      success = await result.current.linkCard('1234567890123456', '12/25', '123');
    });

    expect(success).toBe(false);
  });

  it('should unlink card successfully', async () => {
    const { result } = renderHook(() => useStakePool());

    let success;
    await act(async () => {
      success = await result.current.unlinkCard();
    });

    expect(success).toBe(true);
    expect(mockConnection.confirmTransaction).toHaveBeenCalled();
  });

  it('should handle unlink card error', async () => {
    const error = new Error('Failed to unlink card');
    mockConnection.confirmTransaction.mockRejectedValue(error);

    const { result } = renderHook(() => useStakePool());

    let success;
    await act(async () => {
      success = await result.current.unlinkCard();
    });

    expect(success).toBe(false);
  });
});
