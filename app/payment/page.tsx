'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './payment.module.css';

interface PaymentInfo {
  amount: number;
  currency: string;
  description: string;
  fee: number;
  totalAmount: number;
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams?.get('paymentId');

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [errors, setErrors] = useState({
    cardNumber: false,
    expiryDate: false,
    cvv: false,
    verification: false,
  });

  useEffect(() => {
    if (paymentId) {
      fetchPaymentInfo();
    }
  }, [paymentId]);

  const fetchPaymentInfo = async () => {
    try {
      const response = await fetch(`/api/payment-info?paymentId=${paymentId}`);
      if (response.ok) {
        const data = await response.json();
        setPaymentInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch payment info:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format card number with spaces
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s/g, '');
    let matches = value.match(/\d{1,4}/g);
    let formattedValue = matches ? matches.join(' ') : value;
    setCardNumber(formattedValue);
  };

  // Format expiry date with slash
  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    setExpiryDate(value);
  };

  // Allow only digits for CVV
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCvv(e.target.value.replace(/\D/g, ''));
  };

  // Allow only digits for verification code
  const handleVerificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationCode(e.target.value.replace(/\D/g, ''));
  };

  // Luhn algorithm validation
  const validateLuhn = (cardNumber: string): boolean => {
    const digits = cardNumber.replace(/\s/g, '');
    if (!/^\d+$/.test(digits) || digits.length < 13 || digits.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  // Validate expiry date
  const validateExpiryDate = (expiryDate: string): boolean => {
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      return false;
    }

    const [month, year] = expiryDate.split('/').map(num => parseInt(num));

    if (month < 1 || month > 12) {
      return false;
    }

    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return false;
    }

    return true;
  };

  // Validate CVV
  const validateCVV = (cvv: string): boolean => {
    return /^\d{3}$/.test(cvv);
  };

  // Handle payment button click
  const handlePayment = () => {
    const newErrors = {
      cardNumber: !validateLuhn(cardNumber),
      expiryDate: !validateExpiryDate(expiryDate),
      cvv: !validateCVV(cvv),
      verification: false,
    };

    setErrors(newErrors);

    if (!newErrors.cardNumber && !newErrors.expiryDate && !newErrors.cvv) {
      setShowModal(true);
      setVerificationCode('');
    }
  };

  // Handle verification confirmation
  const handleVerification = async () => {
    if (verificationCode.length !== 6) {
      setErrors({ ...errors, verification: true });
      return;
    }

    try {
      const response = await fetch(`/api/complete-payment?paymentId=${paymentId}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setTransactionId(data.paymentId);
        setShowModal(false);
        setShowSuccess(true);
      }
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  if (loading) {
    return (
      <div className={styles.checkoutContainer}>
        <div className={styles.loading}>Loading payment information...</div>
      </div>
    );
  }

  if (!paymentInfo) {
    return (
      <div className={styles.checkoutContainer}>
        <div className={styles.loading}>Payment not found</div>
      </div>
    );
  }

  return (
    <div className={styles.checkoutContainer}>
      {!showSuccess ? (
        <div>
          <h1 className={styles.title}>Secure Checkout</h1>
          <p className={styles.subtitle}>Complete your payment</p>

          <div className={styles.paymentDetails}>
            <h2>Payment Details</h2>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Description:</span>
              <span className={styles.detailValue}>{paymentInfo.description}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Amount:</span>
              <span className={styles.detailValue}>
                {paymentInfo.amount} {paymentInfo.currency}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Transaction Fee:</span>
              <span className={styles.detailValue}>
                {paymentInfo.fee} {paymentInfo.currency}
              </span>
            </div>
            <div className={`${styles.detailRow} ${styles.totalRow}`}>
              <span className={styles.detailLabel}>Total:</span>
              <span className={styles.detailValue}>
                {paymentInfo.totalAmount} {paymentInfo.currency}
              </span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="cardNumber">Card Number</label>
            <input
              type="text"
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              autoComplete="off"
              value={cardNumber}
              onChange={handleCardNumberChange}
              className={errors.cardNumber ? styles.error : ''}
            />
            {errors.cardNumber && (
              <div className={styles.errorMessage}>Invalid card number</div>
            )}
          </div>

          <div className={styles.cardRow}>
            <div className={styles.formGroup}>
              <label htmlFor="expiryDate">Expiry Date</label>
              <input
                type="text"
                id="expiryDate"
                placeholder="MM/YY"
                maxLength={5}
                autoComplete="off"
                value={expiryDate}
                onChange={handleExpiryDateChange}
                className={errors.expiryDate ? styles.error : ''}
              />
              {errors.expiryDate && (
                <div className={styles.errorMessage}>Invalid or past date</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="cvv">CVV</label>
              <input
                type="text"
                id="cvv"
                placeholder="123"
                maxLength={3}
                autoComplete="off"
                value={cvv}
                onChange={handleCvvChange}
                className={errors.cvv ? styles.error : ''}
              />
              {errors.cvv && (
                <div className={styles.errorMessage}>Must be 3 digits</div>
              )}
            </div>
          </div>

          <button className={styles.payButton} onClick={handlePayment}>
            Pay {paymentInfo.totalAmount} {paymentInfo.currency}
          </button>
        </div>
      ) : (
        <div className={styles.successMessage}>
          <div className={styles.successIcon}>✓</div>
          <h2>Payment Successful!</h2>
          <p>Your transaction has been completed</p>
          <div className={styles.transactionId}>
            Transaction ID: <span>{transactionId}</span>
          </div>
        </div>
      )}

      {/* 3D Secure Modal */}
      {showModal && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className={styles.modal}>
            <div className={styles.bankLogo}>NB</div>
            <h2>NovaBank Secure Verification</h2>
            <p>Enter the 6-digit verification code</p>

            <div className={styles.formGroup}>
              <input
                type="text"
                id="verificationCode"
                className={styles.verificationInput}
                placeholder="000000"
                maxLength={6}
                autoComplete="off"
                value={verificationCode}
                onChange={handleVerificationChange}
              />
              {errors.verification && (
                <div className={styles.errorMessage}>Please enter 6 digits</div>
              )}
            </div>

            <button className={styles.confirmButton} onClick={handleVerification}>
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Payment() {
  return (
    <Suspense fallback={
      <div className={styles.checkoutContainer}>
        <div className={styles.loading}>Loading...</div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
