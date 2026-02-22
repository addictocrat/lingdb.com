'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Button from '@/components/ui/Button';
import { ArrowLeft, ShieldCheck, CreditCard, Lock } from 'lucide-react';
import Link from 'next/link';

export default function PaymentPage() {
  const router = useRouter();
  const locale = useLocale();
  const [isProcessing, setIsProcessing] = useState(false);

  // This is a placeholder for the actual Iyzico integration
  const handleSimulatedPayment = async () => {
    setIsProcessing(true);
    
    // Simulate API call to create subscription
    setTimeout(async () => {
      try {
        const res = await fetch('/api/payment', { method: 'POST' });
        if (res.ok) {
          router.push(`/${locale}/dashboard?upgraded=true`);
        }
      } catch (error) {
        console.error('Payment simulation failed', error);
      } finally {
        setIsProcessing(false);
      }
    }, 2000);
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/${locale}/tiers`}
          className="rounded-lg p-2 text-[var(--fg)]/70 transition-colors hover:bg-[var(--surface)] hover:text-[var(--fg)]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-lg font-semibold uppercase tracking-wider text-[var(--fg)]/50">
          Checkout
        </span>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Checkout Form Placeholder */}
        <div className="md:col-span-2">
          <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--surface)] p-8">
            <div className="mb-8 flex items-center gap-3 border-b border-[var(--border-color)] pb-4">
              <div className="rounded-full bg-primary-100 p-2 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                <CreditCard className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-[var(--fg)]">Payment Details</h2>
            </div>

            <div className="mb-8 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border-color)] bg-[var(--bg)] py-12 text-center opacity-60">
              <Lock className="mb-4 h-8 w-8 text-[var(--fg)]/40" />
              <h3 className="mb-2 text-xl font-bold">Iyzico Integration Placeholder</h3>
              <p className="max-w-md text-lg text-[var(--fg)]/60">
                The actual payment form will be rendered here once the Iyzico API keys and integration logic are provided.
              </p>
            </div>

            <Button
              className="w-full text-xl opacity-50 cursor-not-allowed"
              size="lg"
              onClick={() => {}}
              disabled={true}
            >
              Payment Under Maintenance
            </Button>
            
            <p className="mt-4 text-center text-sm text-[var(--fg)]/40">
              By simulating this payment, your account will be upgraded to Premium instantly for testing purposes.
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="md:col-span-1">
          <div className="sticky top-8 rounded-3xl border border-[var(--border-color)] bg-[var(--surface)] p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-bold">Order Summary</h3>
            
            <div className="mb-4 flex items-start justify-between border-b border-[var(--border-color)] pb-4">
              <div>
                <p className="font-semibold text-[var(--fg)]">Lingdb Premium</p>
                <p className="text-lg text-[var(--fg)]/60">Monthly Subscription</p>
                <div className="mt-2 inline-flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-sm font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Includes 30-Day Free Trial
                </div>
              </div>
              <p className="font-bold">$1.49</p>
            </div>

            <div className="mb-6 space-y-2">
              <div className="flex justify-between text-lg text-[var(--fg)]/60">
                <span>Subtotal</span>
                <span>$1.49</span>
              </div>
              <div className="flex justify-between text-lg text-[var(--fg)]/60">
                <span>Trial Discount</span>
                <span className="text-green-500">-$1.49</span>
              </div>
            </div>

            <div className="flex justify-between border-t border-[var(--border-color)] pt-4 text-xl font-bold">
              <span>Due Today</span>
              <span>$0.00</span>
            </div>

            <ul className="mt-6 space-y-3 text-lg text-[var(--fg)]/60">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary-500" />
                No ads ever
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary-500" />
                100 AI credits monthly
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary-500" />
                Cancel anytime
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
