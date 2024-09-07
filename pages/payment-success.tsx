// pages/payment-success.js
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, updateUserSubscription } from '../pages/api/firebase'; // Adjust the import path as needed

const PaymentSuccess = () => {
  const router = useRouter();
  const { session_id } = router.query;
  const [verificationStatus, setVerificationStatus] = useState('verifying');
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    if (session_id) {
      verifyPayment(session_id);
    }
  }, [session_id]);

  const verifyPayment = async (sessionId) => {
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      const data = await response.json();

      if (data.success) {
        const user = auth.currentUser;
        if (user) {
          await updateUserSubscription(user.uid, 'premium', sessionId);
          setVerificationStatus('success');
          startRedirectTimer();
        } else {
          setVerificationStatus('error');
        }
      } else {
        setVerificationStatus('error');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setVerificationStatus('error');
    }
  };

  const startRedirectTimer = () => {
    const timer = setInterval(() => {
      setSecondsLeft((prevSeconds) => {
        if (prevSeconds <= 1) {
          clearInterval(timer);
          router.push('/generate');
          return 0;
        }
        return prevSeconds - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  };

  const handleManualRedirect = () => {
    router.push('/generate');
  };

  if (verificationStatus === 'verifying') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fcf9ed]">
        <h1 className="text-3xl font-bold text-[#193722] mb-4">Verifying Payment...</h1>
        <p className="text-xl text-[#193722]">Please wait while we confirm your payment.</p>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fcf9ed]">
        <h1 className="text-3xl font-bold text-[#193722] mb-4">Payment Verification Failed</h1>
        <p className="text-xl text-[#193722] mb-4">We couldn't verify your payment. Please contact support.</p>
        <button
          onClick={() => router.push('/support')}
          className="bg-[#193722] text-white py-2 px-4 rounded-full hover:bg-[#254b2d] transition-colors duration-300"
        >
          Contact Support
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fcf9ed]">
      <h1 className="text-3xl font-bold text-[#193722] mb-4">Payment Successful!</h1>
      <p className="text-xl text-[#193722] mb-8">Thank you for upgrading to Premium.</p>
      <p className="text-lg text-[#193722] mb-4">
        You will be redirected to the generate page in {secondsLeft} seconds...
      </p>
      <button
        onClick={handleManualRedirect}
        className="bg-[#193722] text-white py-2 px-4 rounded-full hover:bg-[#254b2d] transition-colors duration-300"
      >
        Go to Generate Page Now
      </button>
    </div>
  );
};

export default PaymentSuccess;