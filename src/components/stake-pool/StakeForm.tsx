'use client';

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

// Địa chỉ stake pool trên devnet (thay thế bằng địa chỉ thực tế của bạn)
const STAKE_POOL_ADDRESS = 'CFXepqvtoz7oPno4vTvqrVp2Vzt43vUebSJpEaqzGoJA';

export function StakeForm() {
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState(false);

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

            // Tạo transaction
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: new PublicKey(STAKE_POOL_ADDRESS),
                    lamports,
                })
            );

            // Gửi transaction
            const signature = await sendTransaction(transaction, connection);

            // Đợi transaction được xác nhận
            await connection.confirmTransaction(signature, 'confirmed');

            toast.success('Stake thành công!');
            setAmount('');
        } catch (error) {
            console.error('Error:', error);
            toast.error('Có lỗi xảy ra khi stake');
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

            // Tạo transaction để unstake
            const transaction = new Transaction().add(
                // Thêm instruction unstake từ smart contract của bạn
            );

            // Gửi transaction
            const signature = await sendTransaction(transaction, connection);

            // Đợi transaction được xác nhận
            await connection.confirmTransaction(signature, 'confirmed');

            toast.success('Unstake thành công!');
            setAmount('');
        } catch (error) {
            console.error('Error:', error);
            toast.error('Có lỗi xảy ra khi unstake');
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

            // Tạo transaction để claim rewards
            const transaction = new Transaction().add(
                // Thêm instruction claim rewards từ smart contract của bạn
            );

            // Gửi transaction
            const signature = await sendTransaction(transaction, connection);

            // Đợi transaction được xác nhận
            await connection.confirmTransaction(signature, 'confirmed');

            toast.success('Nhận lãi thành công!');
        } catch (error) {
            console.error('Error:', error);
            toast.error('Có lỗi xảy ra khi nhận lãi');
        } finally {
            setLoading(false);
        }
    };

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
