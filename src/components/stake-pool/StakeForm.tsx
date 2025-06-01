'use client';

import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, LAMPORTS_PER_SOL, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

// Địa chỉ stake pool trên devnet
const STAKE_POOL_ADDRESS = 'CFXepqvtoz7oPno4vTvqrVp2Vzt43vUebSJpEaqzGoJA';

// Địa chỉ token mint (thay thế bằng địa chỉ thực tế của bạn)
const TOKEN_MINT = new PublicKey('So11111111111111111111111111111111111111112');

// Định nghĩa kiểu lỗi
interface WalletError extends Error {
    logs?: string[];
    code?: number;
}

export function StakeForm() {
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleStake = async () => {
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

            // Chuyển đổi SOL sang lamports
            const lamports = Number(amount) * LAMPORTS_PER_SOL;

            // Kiểm tra số dư
            const balance = await connection.getBalance(publicKey);
            console.log('Current balance:', balance / LAMPORTS_PER_SOL, 'SOL');

            if (balance < lamports) {
                throw new Error(`Số dư không đủ. Cần ${amount} SOL nhưng chỉ có ${balance / LAMPORTS_PER_SOL} SOL`);
            }

            // Import borsh dynamically
            const borsh = await import('borsh');

            // Định nghĩa cấu trúc dữ liệu cho instruction
            class StakeInstruction {
                amount: number;
                constructor(amount: number) {
                    this.amount = amount;
                }
            }

            // Schema cho instruction
            const stakeSchema = {
                struct: {
                    amount: 'u64',
                },
            };

            // Tạo instruction data
            const instruction = new StakeInstruction(lamports);
            const instructionData = borsh.serialize(stakeSchema, instruction);

            // Tạo transaction
            const transaction = new Transaction();

            // Thêm transfer instruction
            const transferInstruction = SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: new PublicKey(STAKE_POOL_ADDRESS),
                lamports,
            });
            transaction.add(transferInstruction);

            // Thêm stake instruction
            const stakeInstruction: TransactionInstruction = {
                keys: [
                    { pubkey: publicKey, isSigner: true, isWritable: true },
                    { pubkey: new PublicKey(STAKE_POOL_ADDRESS), isSigner: false, isWritable: true },
                    { pubkey: TOKEN_MINT, isSigner: false, isWritable: true },
                    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                ],
                programId: new PublicKey(STAKE_POOL_ADDRESS),
                data: Buffer.from(instructionData),
            };
            transaction.add(stakeInstruction);

            // Log transaction details
            console.log('Transaction details:', {
                instructions: transaction.instructions.map(ix => ({
                    programId: ix.programId.toBase58(),
                    keys: ix.keys.map(k => ({
                        pubkey: k.pubkey.toBase58(),
                        isSigner: k.isSigner,
                        isWritable: k.isWritable,
                    })),
                    data: ix.data.toString('hex'),
                })),
            });

            // Lấy recent blockhash
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            transaction.feePayer = publicKey;

            // Log transaction trước khi gửi
            console.log('Transaction before sending:', {
                recentBlockhash: transaction.recentBlockhash,
                lastValidBlockHeight: transaction.lastValidBlockHeight,
                feePayer: transaction.feePayer?.toBase58(),
            });

            // Gửi transaction
            const signature = await sendTransaction(transaction, connection);

            // Log transaction signature
            console.log('Transaction signature:', signature);

            // Đợi transaction được xác nhận
            const confirmation = await connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            });

            // Log transaction confirmation
            console.log('Transaction confirmation:', confirmation);

            if (confirmation.value.err) {
                throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
            }

            toast.success('Stake thành công!');
            setAmount('');
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

            toast.error(`Có lỗi xảy ra khi stake: ${walletError.message || 'Không xác định'}`);
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

            // Import borsh dynamically
            const borsh = await import('borsh');

            // Định nghĩa cấu trúc dữ liệu cho instruction
            class StakeInstruction {
                amount: number;
                constructor(amount: number) {
                    this.amount = amount;
                }
            }

            // Schema cho instruction
            const stakeSchema = {
                struct: {
                    amount: 'u64',
                },
            };

            // Tạo instruction data cho unstake
            const instruction = new StakeInstruction(Number(amount) * LAMPORTS_PER_SOL);
            const instructionData = borsh.serialize(stakeSchema, instruction);

            // Tạo transaction
            const transaction = new Transaction().add({
                keys: [
                    { pubkey: publicKey, isSigner: true, isWritable: true },
                    { pubkey: new PublicKey(STAKE_POOL_ADDRESS), isSigner: false, isWritable: true },
                    { pubkey: TOKEN_MINT, isSigner: false, isWritable: true },
                    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                ],
                programId: new PublicKey(STAKE_POOL_ADDRESS),
                data: Buffer.from(instructionData),
            });

            // Log transaction details
            console.log('Transaction details:', {
                instructions: transaction.instructions.map(ix => ({
                    programId: ix.programId.toBase58(),
                    keys: ix.keys.map(k => ({
                        pubkey: k.pubkey.toBase58(),
                        isSigner: k.isSigner,
                        isWritable: k.isWritable,
                    })),
                    data: ix.data.toString('hex'),
                })),
            });

            // Gửi transaction
            const signature = await sendTransaction(transaction, connection);

            // Log transaction signature
            console.log('Transaction signature:', signature);

            // Đợi transaction được xác nhận
            const confirmation = await connection.confirmTransaction(signature, 'confirmed');

            // Log transaction confirmation
            console.log('Transaction confirmation:', confirmation);

            if (confirmation.value.err) {
                throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
            }

            toast.success('Unstake thành công!');
            setAmount('');
        } catch (error: any) {
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: error.cause,
            });

            // Log additional error information if available
            if (error.logs) {
                console.error('Transaction logs:', error.logs);
            }

            toast.error(`Có lỗi xảy ra khi unstake: ${error.message}`);
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

            // Import borsh dynamically
            const borsh = await import('borsh');

            // Định nghĩa cấu trúc dữ liệu cho instruction
            class StakeInstruction {
                amount: number;
                constructor(amount: number) {
                    this.amount = amount;
                }
            }

            // Schema cho instruction
            const stakeSchema = {
                struct: {
                    amount: 'u64',
                },
            };

            // Tạo instruction data cho claim rewards
            const instruction = new StakeInstruction(0); // amount = 0 cho claim rewards
            const instructionData = borsh.serialize(stakeSchema, instruction);

            // Tạo transaction
            const transaction = new Transaction().add({
                keys: [
                    { pubkey: publicKey, isSigner: true, isWritable: true },
                    { pubkey: new PublicKey(STAKE_POOL_ADDRESS), isSigner: false, isWritable: true },
                    { pubkey: TOKEN_MINT, isSigner: false, isWritable: true },
                    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                ],
                programId: new PublicKey(STAKE_POOL_ADDRESS),
                data: Buffer.from(instructionData),
            });

            // Log transaction details
            console.log('Transaction details:', {
                instructions: transaction.instructions.map(ix => ({
                    programId: ix.programId.toBase58(),
                    keys: ix.keys.map(k => ({
                        pubkey: k.pubkey.toBase58(),
                        isSigner: k.isSigner,
                        isWritable: k.isWritable,
                    })),
                    data: ix.data.toString('hex'),
                })),
            });

            // Gửi transaction
            const signature = await sendTransaction(transaction, connection);

            // Log transaction signature
            console.log('Transaction signature:', signature);

            // Đợi transaction được xác nhận
            const confirmation = await connection.confirmTransaction(signature, 'confirmed');

            // Log transaction confirmation
            console.log('Transaction confirmation:', confirmation);

            if (confirmation.value.err) {
                throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
            }

            toast.success('Nhận lãi thành công!');
        } catch (error: any) {
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: error.cause,
            });

            // Log additional error information if available
            if (error.logs) {
                console.error('Transaction logs:', error.logs);
            }

            toast.error(`Có lỗi xảy ra khi nhận lãi: ${error.message}`);
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
