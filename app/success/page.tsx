'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './success.module.css';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams?.get('paymentId');
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.successIcon}>✓</div>
        <h1 className={styles.title}>Payment Successful!</h1>
        <p className={styles.subtitle}>Your test payment has been completed successfully.</p>
        
        {paymentId && (
          <div className={styles.paymentInfo}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Payment ID:</span>
              <span className={styles.value}>{paymentId}</span>
            </div>
          </div>
        )}

        <div className={styles.redirectInfo}>
          Redirecting to home page in <strong>{countdown}</strong> seconds...
        </div>

        <button 
          className={styles.homeButton}
          onClick={() => router.push('/')}
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loading}>Loading...</div>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
