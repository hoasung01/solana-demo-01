import { Connection, PublicKey } from '@solana/web3.js';
import { MarinadeService } from './marinade-service';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Exchange rates (in a real app, these would come from an API)
const EXCHANGE_RATES = {
  USD: 0.02, // 1 mSOL = $0.02 (example rate)
  VND: 500,  // 1 mSOL = 500 VND (example rate)
};

export class PaymentService {
  private connection: Connection;
  private marinadeService: MarinadeService;

  constructor(connection: Connection) {
    this.connection = connection;
    this.marinadeService = new MarinadeService(connection);
  }

  // Convert mSOL amount to fiat currency
  private convertMSolToFiat(msolAmount: number, currency: 'USD' | 'VND'): number {
    return msolAmount * EXCHANGE_RATES[currency];
  }

  // Convert fiat amount to mSOL
  private convertFiatToMSol(fiatAmount: number, currency: 'USD' | 'VND'): number {
    return fiatAmount / EXCHANGE_RATES[currency];
  }

  // Create a payment intent with Stripe
  async createPaymentIntent(
    amount: number,
    currency: 'USD' | 'VND',
    walletAddress: PublicKey
  ) {
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          walletAddress: walletAddress.toBase58(),
        }),
      });

      const data = await response.json();
      return data.clientSecret;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  // Process payment with mSOL
  async processPayment(
    amount: number,
    currency: 'USD' | 'VND',
    walletAddress: PublicKey,
    wallet: any // Wallet adapter
  ) {
    try {
      // Convert fiat amount to mSOL
      const msolAmount = this.convertFiatToMSol(amount, currency);

      // Check if user has enough mSOL
      const msolBalance = await this.marinadeService.getMSolBalance({
        publicKey: walletAddress,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
        sendTransaction: wallet.sendTransaction,
      });

      if (msolBalance < msolAmount) {
        throw new Error('Insufficient mSOL balance');
      }

      // Create payment intent
      const clientSecret = await this.createPaymentIntent(amount, currency, walletAddress);

      // Initialize Stripe
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to initialize');

      // Confirm the payment
      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: {
            // In a real app, you would collect card details through Stripe Elements
            // This is just for testing
            number: '4242424242424242',
            exp_month: 12,
            exp_year: 2024,
            cvc: '123',
          },
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // Deduct mSOL from user's wallet
      await this.marinadeService.unstakeSol(
        {
          publicKey: walletAddress,
          signTransaction: wallet.signTransaction,
          signAllTransactions: wallet.signAllTransactions,
          sendTransaction: wallet.sendTransaction,
        },
        msolAmount
      );

      toast.success('Payment processed successfully');
      return true;
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed');
      throw error;
    }
  }
}
