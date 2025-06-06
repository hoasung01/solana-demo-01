'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, LAMPORTS_PER_SOL, ComputeBudgetProgram, SystemProgram, TransactionInstruction, Connection } from '@solana/web3.js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

// Địa chỉ program trên devnet
export const PROGRAM_ID = new PublicKey("AH6kLi3PTnRqEqFpNELtBPgnyhdZZSeMeowqPK9aGQ4W");

// Định nghĩa kiểu lỗi
interface WalletError extends Error {
    logs?: string[];
    code?: number;
}

// Định nghĩa kiểu lỗi rate limit
interface RateLimitError extends Error {
    code?: number;
    message: string;
}

// Định nghĩa instruction data theo smart contract
enum StakePoolInstruction {
    Initialize = 0,
    Stake = 1,
    Unstake = 2,
    ClaimRewards = 3,
}

// Hàm tạo instruction data
function createInstructionData(instruction: StakePoolInstruction, amount?: number): Buffer {
    // Tạo buffer với kích thước phù hợp
    const data = Buffer.alloc(amount !== undefined ? 9 : 1);

    // Ghi instruction byte
    data.writeUInt8(instruction, 0);

    // Nếu có amount, ghi vào 8 bytes tiếp theo
    if (amount !== undefined) {
        // Chuyển đổi amount thành 8 bytes little-endian
        for (let i = 0; i < 8; i++) {
            data[i + 1] = (amount >> (i * 8)) & 0xff;
        }
    }

    return data;
}

// Cấu hình RPC endpoints
const RPC_ENDPOINTS = [
    'https://api.devnet.solana.com',
    'https://devnet.solana.rpcpool.com',
    'https://devnet.genesysgo.net',
    'https://devnet.api.rpcpool.com',
    'https://devnet.helius-rpc.com/?api-key=YOUR-API-KEY'  // Bạn cần thay YOUR-API-KEY bằng API key thật
];

// Hàm tạo connection với endpoint
function createConnection(endpoint: string) {
    console.log('Creating connection to:', endpoint);
    const connection = new Connection(endpoint, {
        commitment: 'processed',
        confirmTransactionInitialTimeout: 180000,
        httpHeaders: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': window.location.origin,
            'Referer': window.location.href
        },
        disableRetryOnRateLimit: false
    });

    // Override các phương thức sử dụng WebSocket
    connection.getLatestBlockhash = async (commitment) => {
        const maxRetries = 3;
        let lastError: Error | null = null;

        for (let i = 0; i < maxRetries; i++) {
            try {
                console.log(`Getting latest blockhash (attempt ${i + 1}/${maxRetries})...`);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Origin': window.location.origin,
                        'Referer': window.location.href
                    },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: 1,
                        method: 'getLatestBlockhash',
                        params: [{
                            commitment: commitment || 'confirmed'
                        }]
                    }),
                    signal: controller.signal,
                    mode: 'cors',
                    credentials: 'omit',
                    cache: 'no-cache'
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Blockhash response:', data);

                if (data.error) {
                    throw new Error(data.error.message);
                }

                if (!data.result || !data.result.value || !data.result.value.blockhash) {
                    throw new Error('Invalid blockhash response');
                }

                return {
                    blockhash: data.result.value.blockhash,
                    lastValidBlockHeight: data.result.value.lastValidBlockHeight
                };
            } catch (error) {
                lastError = error as Error;
                console.error(`Attempt ${i + 1} failed:`, error);

                if (i < maxRetries - 1) {
                    const delay = Math.min(1000 * Math.pow(2, i), 10000);
                    console.log(`Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError || new Error('Failed to get latest blockhash after retries');
    };

    return connection;
}

// Hàm kiểm tra kết nối internet
async function checkInternetConnection(): Promise<boolean> {
    try {
        console.log('Checking internet connection...');

        // Kiểm tra trạng thái online của trình duyệt
        if (!navigator.onLine) {
            console.log('Browser reports offline status');
            return false;
        }

        // Thử kết nối đến Solana devnet
        try {
            console.log('Trying to connect to Solana devnet...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            console.log('Sending health check request...');
            const response = await fetch('https://api.devnet.solana.com', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'getHealth'
                }),
                signal: controller.signal,
                mode: 'cors',
                credentials: 'omit',
                cache: 'no-cache'
            });

            clearTimeout(timeoutId);
            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                console.error('Health check failed with status:', response.status);
                return false;
            }

            const data = await response.json();
            console.log('Health check response:', data);
            return true;
        } catch (error) {
            console.error('Failed to connect to Solana devnet:', error);
            if (error instanceof Error) {
                console.error('Error name:', error.name);
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
            }
            return false;
        }
    } catch (error) {
        console.error('Connection check failed with error:', error);
        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        return false;
    }
}

// Hàm kiểm tra lỗi rate limit
function isRateLimitError(error: unknown): error is RateLimitError {
    const err = error as RateLimitError;
    return err?.message?.includes('rate limit') ||
           err?.message?.includes('429') ||
           err?.code === 429;
}

// Hàm kiểm tra kết nối với retry
async function checkConnectionWithFallback(): Promise<Connection> {
    let lastError: Error | null = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
        console.log(`Connection attempt ${retryCount + 1}/${maxRetries}`);

        // Kiểm tra kết nối internet trước
        const isConnected = await checkInternetConnection();
        if (!isConnected) {
            console.log('Internet connection check failed');
            throw new Error('Không có kết nối internet. Vui lòng kiểm tra lại kết nối của bạn.');
        }

        for (const endpoint of RPC_ENDPOINTS) {
            try {
                console.log(`Trying to connect to Solana devnet at ${endpoint}...`);
                const testConnection = createConnection(endpoint);

                // Thử lấy block height với timeout
                console.log('Getting block height...');
                const blockHeightPromise = testConnection.getBlockHeight();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 30000)
                );

                const blockHeight = await Promise.race([blockHeightPromise, timeoutPromise]);
                console.log(`Successfully connected to Solana devnet at ${endpoint} - Block Height: ${blockHeight}`);

                // Nếu kết nối thành công, trả về connection ngay lập tức
                return testConnection;
            } catch (error) {
                lastError = error as Error;
                console.error(`Failed to connect to ${endpoint}:`, error);
                if (error instanceof Error) {
                    console.error('Error name:', error.name);
                    console.error('Error message:', error.message);
                    console.error('Error stack:', error.stack);
                }
            }
        }

        retryCount++;
        if (retryCount < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    console.error('All connection attempts failed:', lastError);
    throw new Error(`Không thể kết nối đến Solana devnet sau ${maxRetries} lần thử. Lỗi: ${lastError?.message}`);
}

// Hàm retry với xử lý rate limit
async function retry<T>(
    fn: () => Promise<T>,
    connection: Connection,
    retries: number = 3,
    delay: number = 1000,
    timeout: number = 10000
): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
        try {
            // Tạo promise với timeout
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Request timeout')), timeout);
            });

            // Race giữa fn() và timeout
            const result = await Promise.race([fn(), timeoutPromise]);
            return result;
        } catch (error) {
            lastError = error as Error;
            console.error(`Attempt ${i + 1} failed:`, error);

            // Nếu là lỗi rate limit, tăng thời gian chờ
            if (isRateLimitError(error)) {
                const rateLimitDelay = Math.min(2000 * Math.pow(2, i), 10000);
                console.log(`Rate limit hit, waiting ${rateLimitDelay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
                continue;
            }

            if (i < retries - 1) {
                const backoffDelay = Math.min(delay * Math.pow(2, i), 10000);
                console.log(`Retrying in ${backoffDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, backoffDelay));
            }
        }
    }

    throw lastError || new Error('Failed after retries');
}

// Hàm xác nhận transaction với retry
const confirmTransactionWithRetry = async (
    connection: Connection,
    signature: string,
    maxRetries = 5
): Promise<boolean> => {
    let retries = 0;
    let lastError: Error | null = null;

    while (retries < maxRetries) {
        try {
            console.log(`Confirmation attempt ${retries + 1}...`);

            // Get the latest blockhash with confirmed commitment
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash({
                commitment: 'confirmed'
            });

            // Use confirmed commitment for more reliable confirmation
            const confirmation = await connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            }, 'confirmed');

            if (confirmation.value.err) {
                throw new Error(`Transaction failed: ${confirmation.value.err}`);
            }

            console.log('Transaction confirmed:', confirmation);
            return true;
        } catch (error) {
            lastError = error as Error;
            console.error(`Confirmation attempt ${retries + 1} failed:`, error);

            // If it's a block height error, try to get transaction status
            if (error instanceof Error && error.message?.includes('block height exceeded')) {
                console.log('Block height exceeded, checking transaction status...');

                try {
                    // Try to get transaction status with a longer timeout
                    const txStatus = await Promise.race([
                        connection.getSignatureStatus(signature, {
                            searchTransactionHistory: true
                        }),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Status check timeout')), 30000)
                        )
                    ]) as { value: { err: { code: number; message: string } | null; confirmationStatus: string } | null } | null;

                    if (txStatus?.value?.err) {
                        throw new Error(`Transaction failed: ${txStatus.value.err.message}`);
                    }

                    // If we can get the status but it's not confirmed, wait a bit longer
                    if (txStatus?.value?.confirmationStatus === 'processed') {
                        console.log('Transaction is processed, waiting for confirmation...');
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        continue;
                    }
                } catch (statusError) {
                    console.error('Failed to get transaction status:', statusError);
                }
            }

            retries++;
            if (retries < maxRetries) {
                // Increase delay between retries
                const delay = Math.min(2000 * Math.pow(2, retries), 30000);
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw new Error(`Failed to confirm transaction after ${maxRetries} attempts. Last error: ${lastError?.message}`);
};

export function StakeForm() {
    const { publicKey, sendTransaction } = useWallet();
    const [connection, setConnection] = useState<Connection | null>(null);
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Thêm useEffect để kiểm tra trạng thái kết nối
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Thử kết nối lại khi có internet
            checkInitialConnection();
        };
        const handleOffline = () => {
            setIsOnline(false);
            setIsConnected(false);
            toast.error('Mất kết nối internet. Vui lòng kiểm tra lại kết nối của bạn.');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Kiểm tra trạng thái ban đầu
        setIsOnline(navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Hàm kiểm tra kết nối ban đầu
    const checkInitialConnection = async () => {
        if (!isOnline) {
            toast.error('Không có kết nối internet. Vui lòng kiểm tra lại kết nối của bạn.');
            return;
        }

        try {
            const newConnection = await checkConnectionWithFallback();
            setConnection(newConnection);
            setIsConnected(true);
            toast.success('Đã kết nối đến Solana devnet');
        } catch (error) {
            console.error('Failed to establish initial connection:', error);
            toast.error('Không thể kết nối đến Solana devnet. Vui lòng thử lại sau.');
            setIsConnected(false);
        }
    };

    // Cập nhật useEffect kiểm tra kết nối ban đầu
    useEffect(() => {
        checkInitialConnection();
    }, [isOnline]);

    const handleStake = async () => {
        if (!publicKey) {
            toast.error('Vui lòng kết nối ví');
            return;
        }

        if (!connection || !isConnected) {
            toast.error('Đang mất kết nối đến Solana devnet. Vui lòng thử lại sau.');
            return;
        }

        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error('Vui lòng nhập số lượng SOL hợp lệ');
            return;
        }

        try {
            setLoading(true);

            // Chuyển đổi SOL sang lamports
            const lamports = Number(amount) * LAMPORTS_PER_SOL;

            // Kiểm tra số dư với retry
            const balance = await retry(
                () => connection.getBalance(publicKey),
                connection
            );
            if (balance < lamports) {
                throw new Error(`Số dư không đủ. Cần ${amount} SOL nhưng chỉ có ${balance / LAMPORTS_PER_SOL} SOL`);
            }

            // Tạo PDA cho stake pool
            const [stakePoolPda] = PublicKey.findProgramAddressSync(
                [Buffer.from('stake_pool')],
                PROGRAM_ID
            );

            // Kiểm tra và khởi tạo stake pool nếu cần
            const stakePoolInfo = await retry(
                () => connection.getAccountInfo(stakePoolPda),
                connection
            );

            // Get blockhash with confirmed commitment
            const { blockhash, lastValidBlockHeight } = await retry(
                () => connection.getLatestBlockhash('confirmed'),
                connection
            );

            console.log('Got blockhash:', blockhash);

            if (!stakePoolInfo) {
                // Nếu chưa có pool, chỉ gửi transaction khởi tạo pool
                const instructions = [];

                // Thêm compute budget instruction
                const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ units: 300000 });
                instructions.push(modifyComputeUnits);

                const createAccountInstruction = SystemProgram.createAccount({
                    fromPubkey: publicKey,
                    newAccountPubkey: stakePoolPda,
                    lamports: await retry(
                        () => connection.getMinimumBalanceForRentExemption(24),
                        connection
                    ),
                    space: 24,
                    programId: PROGRAM_ID,
                });
                instructions.push(createAccountInstruction);

                const initData = createInstructionData(StakePoolInstruction.Initialize);
                const initIx = new TransactionInstruction({
                    programId: PROGRAM_ID,
                    keys: [
                        { pubkey: stakePoolPda, isSigner: false, isWritable: true },
                        { pubkey: publicKey, isSigner: true, isWritable: true },
                    ],
                    data: initData,
                });
                instructions.push(initIx);

                // Tạo transaction thông thường
                const transaction = new Transaction();
                transaction.feePayer = publicKey;
                transaction.recentBlockhash = blockhash;
                transaction.lastValidBlockHeight = lastValidBlockHeight;

                // Thêm tất cả instructions
                instructions.forEach(ix => transaction.add(ix));

                try {
                    console.log('Sending transaction with blockhash:', blockhash);
                    const signature = await sendTransaction(transaction, connection);
                    console.log('Transaction sent with signature:', signature);

                    // Đợi transaction được xác nhận với retry
                    const confirmed = await confirmTransactionWithRetry(connection, signature);
                    if (confirmed) {
                        toast.success('Khởi tạo pool thành công! Hãy stake lại.');
                        setAmount('');
                    }
                } catch (error) {
                    console.error('Transaction error:', error);
                    throw error;
                }
            }

            // Nếu pool đã tồn tại, thực hiện stake như cũ
            const instructions = [];

            // Thêm compute budget instruction
            const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ units: 300000 });
            instructions.push(modifyComputeUnits);

            // Thêm instruction chuyển SOL
            const transferInstruction = SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: stakePoolPda,
                lamports: lamports
            });
            instructions.push(transferInstruction);

            const stakeData = createInstructionData(StakePoolInstruction.Stake, lamports);
            const stakeIx = new TransactionInstruction({
                programId: PROGRAM_ID,
                keys: [
                    { pubkey: stakePoolPda, isSigner: false, isWritable: true },
                    { pubkey: publicKey, isSigner: true, isWritable: true },
                ],
                data: stakeData,
            });
            instructions.push(stakeIx);

            // Tạo transaction thông thường
            const transaction = new Transaction();
            transaction.feePayer = publicKey;
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;

            // Thêm tất cả instructions
            instructions.forEach(ix => transaction.add(ix));

            try {
                console.log('Sending transaction with blockhash:', blockhash);
                const signature = await sendTransaction(transaction, connection);
                console.log('Transaction sent with signature:', signature);

                // Đợi transaction được xác nhận với retry
                const confirmed = await confirmTransactionWithRetry(connection, signature);
                if (confirmed) {
                    toast.success('Stake thành công!');
                    setAmount('');
                }
            } catch (error) {
                console.error('Transaction error:', error);
                throw error;
            }
        } catch (error) {
            const walletError = error as WalletError;
            let errorMessage = 'Có lỗi xảy ra khi stake';
            if (walletError.message) {
                errorMessage += `: ${walletError.message}`;
            }
            console.error('Stake error:', error);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleUnstake = async () => {
        if (!publicKey) {
            toast.error('Vui lòng kết nối ví');
            return;
        }

        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error('Vui lòng nhập số lượng SOL hợp lệ');
            return;
        }

        try {
            setLoading(true);
            toast.error('Chức năng unstake chưa được triển khai');
        } catch (error) {
            const walletError = error as WalletError;
            console.error('Error details:', {
                name: walletError.name,
                message: walletError.message,
                stack: walletError.stack,
                cause: walletError.cause,
                code: walletError.code,
                logs: walletError.logs,
            });

            toast.error(`Có lỗi xảy ra khi unstake: ${walletError.message || 'Không xác định'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleClaimRewards = async () => {
        if (!publicKey) {
            toast.error('Vui lòng kết nối ví');
            return;
        }

        try {
            setLoading(true);
            toast.error('Chức năng nhận lãi chưa được triển khai');
        } catch (error) {
            const walletError = error as WalletError;
            console.error('Error details:', {
                name: walletError.name,
                message: walletError.message,
                stack: walletError.stack,
                cause: walletError.cause,
                code: walletError.code,
                logs: walletError.logs,
            });

            toast.error(`Có lỗi xảy ra khi nhận lãi: ${walletError.message || 'Không xác định'}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isClient) {
        return null;
    }

    return (
        <Card className="w-[350px]">
            <CardHeader>
                <CardTitle>Stake SOL</CardTitle>
                <CardDescription>
                    Stake SOL để nhận lãi suất 5% mỗi năm
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid w-full items-center gap-4">
                    <div className="flex flex-col space-y-1.5">
                        <Input
                            type="number"
                            placeholder="Số lượng SOL"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="flex flex-col space-y-2">
                        <Button
                            onClick={handleStake}
                            disabled={loading || !publicKey}
                        >
                            {loading ? 'Đang xử lý...' : 'Stake'}
                        </Button>
                        <Button
                            onClick={handleUnstake}
                            variant="outline"
                            disabled={loading || !publicKey}
                        >
                            {loading ? 'Đang xử lý...' : 'Unstake'}
                        </Button>
                        <Button
                            onClick={handleClaimRewards}
                            variant="secondary"
                            disabled={loading || !publicKey}
                        >
                            {loading ? 'Đang xử lý...' : 'Nhận Lãi'}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
