This is a [Next.js](https://nextjs.org) project bootstrapped with [
`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions
are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use
the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)
from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for
more details.

# Solana Demo Project

A Solana-based application that integrates with Marinade Finance for liquid staking and credit card functionality.

## Features

### Liquid Staking with Marinade Finance
- Stake SOL to receive mSOL tokens
- Unstake mSOL back to SOL
- Real-time mSOL price tracking
- View your mSOL balance
- Seamless integration with Marinade Finance's liquid staking protocol

### Credit Card Integration
- Use mSOL as collateral for credit card transactions
- Real-time credit limit based on mSOL holdings
- Secure transaction processing
- Instant credit line updates

## Technical Stack

- **Frontend**: Next.js 14 with TypeScript
- **UI Components**: Radix UI with Tailwind CSS
- **Wallet Integration**: Solana Wallet Adapter
- **Staking Protocol**: Marinade Finance
- **State Management**: TanStack Query
- **Notifications**: Sonner

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/solana-demo-01.git
cd solana-demo-01
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your configuration:
```env
NEXT_PUBLIC_RPC_ENDPOINT=your_rpc_endpoint
```

4. Run the development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── components/
│   ├── solana/
│   │   ├── stake-manager.tsx    # Marinade Finance staking interface
│   │   └── wallet-provider.tsx  # Wallet connection management
│   └── ui/                      # Reusable UI components
├── hooks/
│   ├── use-marinade-staking.ts  # Marinade Finance integration
│   └── use-stake-pool.ts        # Stake pool management
└── lib/
    └── constants.ts             # Application constants
```

## How It Works

### Liquid Staking
1. Connect your Solana wallet
2. Stake SOL to receive mSOL tokens through Marinade Finance
3. Monitor your mSOL balance and current exchange rate
4. Unstake mSOL back to SOL when needed

### Credit Card Integration
1. Your credit limit is calculated based on your mSOL holdings
2. Use your credit card for transactions
3. mSOL serves as collateral for your credit line
4. Real-time updates to your available credit based on mSOL value

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Marinade Finance](https://app.marinade.finance/) for their liquid staking protocol
- [Solana](https://solana.com/) for the blockchain infrastructure
- [Next.js](https://nextjs.org/) for the React framework

## Yêu cầu hệ thống

- Node.js 16+
- Solana CLI tools
- Wallet adapter (Phantom, Solflare, etc.)

## Cài đặt

1. Clone repository:
```bash
git clone <repository-url>
cd solana-demo-01
```

2. Cài đặt dependencies:
```bash
npm install
```

## Thiết lập Local Validator

Để phát triển và test ứng dụng, chúng ta sẽ sử dụng Solana local validator thay vì devnet. Điều này giúp:
- Phát triển và test nhanh hơn
- Không bị giới hạn bởi rate limits
- Có thể reset blockchain state bất cứ lúc nào
- Không phụ thuộc vào kết nối internet

### 1. Cài đặt Solana CLI tools

```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.17.9/install)"
```

### 2. Khởi động Local Validator

```bash
solana-test-validator
```

Local validator sẽ chạy tại `http://localhost:8899`

### 3. Cấu hình Solana CLI

```bash
solana config set --url localhost
```

### 4. Tạo ví test và airdrop SOL

```bash
# Tạo ví test mới
solana-keygen new --outfile test-wallet.json

# Airdrop 100 SOL vào ví test
solana airdrop 100 test-wallet.json
```

### 5. Kiểm tra kết nối

```bash
# Kiểm tra kết nối đến local validator
solana ping

# Kiểm tra số dư ví
solana balance test-wallet.json
```

## Chạy ứng dụng

1. Khởi động local validator (nếu chưa chạy):
```bash
solana-test-validator
```

2. Chạy ứng dụng:
```bash
npm run dev
```

3. Mở trình duyệt và truy cập `http://localhost:3000`

## Các lệnh hữu ích

### Reset Local Validator
```bash
# Dừng validator hiện tại
pkill solana-test-validator

# Xóa ledger cũ
rm -rf test-ledger

# Khởi động lại validator
solana-test-validator
```

### Xem logs của validator
```bash
solana logs
```

### Kiểm tra trạng thái validator
```bash
solana block-production
```

## Lưu ý

- Local validator chỉ nên sử dụng cho môi trường development
- Khi deploy lên production, cần chuyển sang sử dụng devnet hoặc mainnet
- Đảm bảo luôn có đủ SOL trong ví test để thực hiện các giao dịch
- Có thể reset blockchain state bất cứ lúc nào bằng cách khởi động lại validator

## Troubleshooting

### 1. Không kết nối được đến local validator
- Kiểm tra xem validator đã chạy chưa
- Kiểm tra port 8899 có đang được sử dụng không
- Thử reset validator

### 2. Lỗi "Insufficient funds"
- Airdrop thêm SOL vào ví test
- Kiểm tra số dư hiện tại

### 3. Lỗi "Connection refused"
- Kiểm tra xem validator có đang chạy không
- Thử khởi động lại validator
- Kiểm tra firewall settings

## Project Structure
```
solana-demo-01/
├── programs/           # Smart contracts
│   └── stake-pool/    # Stake pool program
├── src/               # Frontend application
│   ├── app/          # Next.js app directory
│   └── components/   # React components
└── README.md
```

## Prerequisites
- Node.js 18+
- Rust
- Solana CLI tools
- Phantom Wallet

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Deploy Smart Contract

#### 2.1. Install Solana CLI Tools

**macOS:**
```bash
brew install solana
```

**Linux:**
```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.17.9/install)"
```

**Windows:**
Download and install from [Solana releases page](https://github.com/solana-labs/solana/releases)

#### 2.2. Configure Solana CLI for Devnet
```bash
solana config set --url devnet
```

#### 2.3. Create New Wallet for Deployment
```bash
solana-keygen new
```

#### 2.4. Get Devnet SOL for Deployment
```bash
solana airdrop 2
```

#### 2.5. Build and Deploy Program
```bash
cd programs/stake-pool
cargo build-sbf
solana program deploy target/deploy/stake_pool.so
```

Sau khi deploy thành công, bạn sẽ nhận được một địa chỉ program (ví dụ: `CFXepqvtoz7oPno4vTvqrVp2Vzt43vUebSJpEaqzGoJA`). Đây chính là `STAKE_POOL_ADDRESS` cần được cập nhật trong file `src/components/stake-pool/StakeForm.tsx`.

### 3. Update Frontend Configuration

1. Mở file `src/components/stake-pool/StakeForm.tsx`
2. Tìm dòng:
```typescript
const STAKE_POOL_ADDRESS = '11111111111111111111111111111111';
```
3. Thay thế bằng địa chỉ program đã deploy:
```typescript
const STAKE_POOL_ADDRESS = 'YOUR_DEPLOYED_PROGRAM_ADDRESS';
```

### 4. Run the Application
```bash
npm run dev
```

## Features
- Connect Solana wallet
- View wallet balance
- Stake SOL
- Unstake SOL
- Claim rewards

## Development

### Smart Contract
The stake pool program is written in Rust and uses the Solana Program Framework. Key features:
- Stake SOL
- Unstake SOL
- Calculate and distribute rewards
- Track user stakes

### Frontend
The frontend is built with:
- Next.js 14
- TypeScript
- Tailwind CSS
- Shadcn UI
- Solana Web3.js
- Solana Wallet Adapter

## Testing
1. Connect your Phantom wallet
2. Switch to Devnet in wallet settings
3. Get Devnet SOL from faucet:
   - https://solfaucet.com/
   - https://faucet.solana.com/
4. Try staking, unstaking, and claiming rewards

## Next Steps
- [ ] Add more wallet adapters
- [ ] Implement stake pool statistics
- [ ] Add stake history
- [ ] Improve error handling
- [ ] Add unit tests
- [ ] Add integration tests
