// pages/payment-success.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './api/firebase';
import { ChefHat, Check, ArrowRight, RefreshCw } from 'lucide-react';
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";

const PaymentSuccess: React.FC = () => {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [secondsLeft, setSecondsLeft] = useState(10); 

  useEffect(() => {
    // Start redirect timer when component mounts
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
  }, [router]);

  const handleManualRedirect = () => {
    router.push('/generate');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100/50">
        <Header />
        <main className="flex-grow flex items-center justify-center px-4 py-16 pt-24">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Loading...</h1>
              <p className="text-gray-600">Please wait a moment</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100/50">
      <Header />
      <main className="flex-grow flex items-center justify-center px-4 py-16 pt-24">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="text-green-500 w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-4">Thank you for upgrading to Premium. Your account has been upgraded!</p>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
              <div className="flex items-center mb-2">
                <RefreshCw className="text-blue-500 w-5 h-5 mr-2" />
                <h3 className="font-semibold text-blue-800">Important Note</h3>
              </div>
              <p className="text-sm text-blue-700 mb-2">
                It may take a few minutes for your premium benefits to become fully active in the system.
              </p>
              <p className="text-sm text-blue-700">
                If you don't see your premium features right away, please try refreshing the page after a few minutes.
              </p>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <ChefHat className="text-amber-500 w-5 h-5 mr-2" />
                <h3 className="font-semibold text-amber-800">Your Premium Benefits</h3>
              </div>
              <ul className="text-sm text-amber-700 space-y-2 text-left">
                <li className="flex items-center">
                  <span className="w-1 h-1 bg-amber-500 rounded-full mr-2"></span>
                  10 recipe generations per day
                </li>
                <li className="flex items-center">
                  <span className="w-1 h-1 bg-amber-500 rounded-full mr-2"></span>
                  50 recipe suggestions per scan
                </li>
                <li className="flex items-center">
                  <span className="w-1 h-1 bg-amber-500 rounded-full mr-2"></span>
                  Access to premium recipes
                </li>
                <li className="flex items-center">
                  <span className="w-1 h-1 bg-amber-500 rounded-full mr-2"></span>
                  Priority support
                </li>
              </ul>
            </div>
            
            <p className="text-gray-600 mb-6">
              You will be redirected to the recipe generator in {secondsLeft} seconds...
            </p>
            
            <button
              onClick={handleManualRedirect}
              className="w-full py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center"
            >
              Start Generating Recipes Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;