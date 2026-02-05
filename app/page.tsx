'use client';

import { useState } from 'react';
import styles from './page.module.css';

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF'];

export default function Home() {
  const [amount, setAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [email, setEmail] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleAmountSelect = (value: number) => {
    setAmount(value);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setCustomAmount(value);
    if (value && !isNaN(parseFloat(value))) {
      setAmount(parseFloat(value));
    }
  };

  const generateOrderId = (): string => {
    // Use crypto.randomUUID for secure unique identifier
    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    return `ORDER-${uuid.substring(0, 8).toUpperCase()}`;
  };

  const handleCreatePayment = async () => {
    // Validation
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const orderId = generateOrderId();
      
      // Use environment variable for API key, fallback to demo key for local development
      const apiKey = process.env.NEXT_PUBLIC_PAYMENT_API_KEY || 'pk_0a1092c08019e9c8bcfb566d078e8751b6de39dcd3afe943488323b407a6488d';
      
      const response = await fetch('/api/payment-gateway/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          amount,
          currency,
          description: description || `Test Payment - ${orderId}`,
          customerEmail: email,
          orderId,
          successUrl: `${window.location.origin}/success`,
          webhookUrl: `${window.location.origin}/api/webhook`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment');
      }

      // Redirect to payment URL
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error('No payment URL returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.checkoutContainer}>
      <div className={styles.demoWarning}>
        ⚠️ TEST PAYMENT GATEWAY — NOT A REAL TRANSACTION
      </div>

      <h1 className={styles.title}>Test Payment</h1>
      <p className={styles.subtitle}>Create a test payment with the payment gateway API</p>

      {/* Amount Selection */}
      <div className={styles.formGroup}>
        <label>Select Amount</label>
        <div className={styles.amountGrid}>
          {PRESET_AMOUNTS.map((presetAmount) => (
            <button
              key={presetAmount}
              type="button"
              className={`${styles.amountButton} ${amount === presetAmount && !customAmount ? styles.amountButtonActive : ''}`}
              onClick={() => handleAmountSelect(presetAmount)}
            >
              {presetAmount} {currency}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div className={styles.formGroup}>
        <label htmlFor="customAmount">Or Enter Custom Amount</label>
        <input
          type="text"
          id="customAmount"
          placeholder="Enter amount..."
          value={customAmount}
          onChange={handleCustomAmountChange}
          autoComplete="off"
        />
      </div>

      {/* Currency Selection */}
      <div className={styles.formGroup}>
        <label htmlFor="currency">Currency</label>
        <select
          id="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className={styles.selectField}
        >
          {CURRENCIES.map((curr) => (
            <option key={curr} value={curr}>{curr}</option>
          ))}
        </select>
      </div>

      {/* Email */}
      <div className={styles.formGroup}>
        <label htmlFor="email">Email Address</label>
        <input
          type="email"
          id="email"
          placeholder="customer@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>

      {/* Description */}
      <div className={styles.formGroup}>
        <label htmlFor="description">Description (optional)</label>
        <input
          type="text"
          id="description"
          placeholder="Order description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorAlert}>
          {error}
        </div>
      )}

      {/* Payment Summary */}
      <div className={styles.paymentSummary}>
        <div className={styles.summaryRow}>
          <span>Amount:</span>
          <span>{amount} {currency}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Fee (2.5%):</span>
          <span>{(amount * 0.025).toFixed(2)} {currency}</span>
        </div>
        <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
          <span>Total:</span>
          <span>{(amount * 1.025).toFixed(2)} {currency}</span>
        </div>
      </div>

      {/* Submit Button */}
      <button 
        className={styles.payButton} 
        onClick={handleCreatePayment}
        disabled={loading}
      >
        {loading ? 'Creating Payment...' : `Pay ${(amount * 1.025).toFixed(2)} ${currency}`}
      </button>

      {/* API Info */}
      <div className={styles.apiInfo}>
        <p>This test page integrates with the Payment Gateway API</p>
        <code>POST /api/payment-gateway/payments</code>
      </div>
    </div>
  );
}
