// pages/subscription.jsx
import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useSubscription } from '../hooks/useSubscription';
import { auth } from './api/firebase';
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import { Loader, AlertCircle, Info, CheckCircle, Crown } from 'lucide-react';

export default function SubscriptionPage() {
  const [user, userLoading] = useAuthState(auth);
  const { isPremium, subscription, loading: subLoading } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const db = getFirestore();

  // Ensure user document exists
  useEffect(() => {
    const createUserDocIfNeeded = async () => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            console.log("Creating missing user document for:", user.uid);
            await setDoc(userRef, {
              email: user.email,
              displayName: user.displayName || null,
              photoURL: user.photoURL || null,
              subscriptionTier: "free",
              dailyGenerations: 0,
              lastResetDate: new Date().toISOString(),
              createdAt: serverTimestamp()
            });
            console.log("Created user document successfully");
          }
        } catch (error) {
          console.error("Error checking/creating user document:", error);
        }
      }
    };
    
    createUserDocIfNeeded();
  }, [db, user]);

  // Check URL params for status on load (for redirect back from payment)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get('status');
      
      if (status === 'success') {
        setSuccessMessage("Payment successful! Your subscription has been activated.");
        // Clear URL params
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (status === 'cancel') {
        setInfoMessage("Payment was canceled. Your subscription has not been changed.");
        // Clear URL params
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleUpgrade = async () => {
    console.log("Upgrade button clicked");
    if (!user) {
      console.error("No user found");
      setErrorMessage("You must be logged in to upgrade");
      return;
    }
    
    console.log("User info:", {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });
    
    setIsLoading(true);
    setErrorMessage("");
    setInfoMessage("Setting up your subscription...");
    
    try {
      // Call your API endpoint to create a checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include authentication if needed
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email || '',
          name: user.displayName || ''
        }),
      });
      
      if (!response.ok) {
        // Parse error message if available
        let errorMessage = 'Failed to create checkout session';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {}
        
        throw new Error(errorMessage);
      }
      
      const { url } = await response.json();
      
      if (url) {
        console.log("Redirecting to checkout URL:", url);
        setInfoMessage("Redirecting to checkout page...");
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned from the server');
      }
    } catch (error) {
      console.error("Error in handleUpgrade:", error);
      setErrorMessage((error instanceof Error) ? error.message : "An unexpected error occurred");
      setInfoMessage("");
      setIsLoading(false);
    }
  };
  
  const handleManageSubscription = async () => {
    console.log("Manage subscription clicked");
    if (!user) return;
    
    setIsLoading(true);
    setErrorMessage("");
    setInfoMessage("Preparing customer portal...");
  
    try {
      // Get user data to fetch stripeCustomerId
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const stripeCustomerId = userData?.stripeCustomerId;
    
      if (!stripeCustomerId) {
        console.error("No customer ID found for user");
        setErrorMessage("No subscription found to manage");
        setIsLoading(false);
        setInfoMessage("");
        return;
      }
    
      console.log("Creating portal session for customer:", stripeCustomerId);
      
      // Call an API endpoint to create a portal session
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          customerId: stripeCustomerId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create customer portal');
      }
      
      const { url } = await response.json();
      
      if (url) {
        console.log("Redirecting to:", url);
        setInfoMessage("Redirecting to customer portal...");
        window.location.href = url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error) {
      console.error("Error in handleManageSubscription:", error);
      setErrorMessage((error instanceof Error) ? error.message : "An unexpected error occurred");
      setIsLoading(false);
      setInfoMessage("");
    }
  };
  
  // Display loading UI while fetching user or subscription data
  if (userLoading || subLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 to-amber-100/50">
        <Header />
        <main className="flex-grow flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </main>
        <Footer />
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    typeof window !== 'undefined' && window.location.replace('/login');
    return null;
  }

  // Get recipe counts for display
  const freeRecipeCount = 6;
  const premiumRecipeCount = 25; 

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 to-amber-100/50">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Subscription</h1>
          
          {/* Messages: Error, Info, Success */}
          {errorMessage && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}
          
          {infoMessage && (
            <div className="bg-blue-50 text-blue-700 p-4 rounded-lg mb-6 border border-blue-200 flex items-start">
              <Info className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>{infoMessage}</p>
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 border border-green-200 flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>{successMessage}</p>
            </div>
          )}
          
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <h2 className="text-xl font-bold">
                Current Plan: {isPremium ? 'Premium' : 'Free'}
              </h2>
              {isPremium && (
                <div className="ml-3 bg-amber-100 text-amber-700 px-3 py-1 rounded-full flex items-center">
                  <Crown className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Premium</span>
                </div>
              )}
            </div>
            
            {/* Plan details */}
            <div className="mb-8">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">Recipe Generations</p>
                  <p className="text-2xl font-bold text-amber-500">
                    {subscription?.limits.maxGenerations || 0} <span className="text-sm text-gray-500">per day</span>
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">Recipe Suggestions</p>
                  <p className="text-2xl font-bold text-amber-500">
                    {isPremium ? premiumRecipeCount : freeRecipeCount} <span className="text-sm text-gray-500">per scan</span>
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <p className="text-gray-600">
                  {subscription?.generationsLeft} generations left today
                </p>
              </div>
            </div>
            
            {isPremium ? (
              <>
                <p className="mb-6 text-gray-600">
                  You currently have access to all premium features! Manage your subscription settings below.
                </p>
                <button 
                  onClick={handleManageSubscription}
                  disabled={isLoading}
                  className="w-full py-3 bg-gray-100 text-gray-800 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : 'Manage Subscription'}
                </button>
              </>
            ) : (
              <>
                <p className="mb-6 text-gray-600">
                  Upgrade to Premium for more recipe generations and exclusive features!
                </p>
                <button 
                  onClick={handleUpgrade}
                  disabled={isLoading}
                  className="w-full py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : 'Upgrade to Premium ($2.99/month)'}
                </button>
              </>
            )}
          </div>
          
          {/* Plan comparison */}
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-6">Plan Comparison</h2>
            
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-gray-500 font-medium">Feature</th>
                    <th className="px-6 py-4 text-center text-gray-500 font-medium">Free</th>
                    <th className="px-6 py-4 text-center text-amber-500 font-medium">Premium</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-6 py-4 text-gray-800">Daily Recipe Generations</td>
                    <td className="px-6 py-4 text-center text-gray-800">3</td>
                    <td className="px-6 py-4 text-center text-gray-800">10</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-gray-800">Recipe Suggestions</td>
                    <td className="px-6 py-4 text-center text-gray-800">{freeRecipeCount}</td>
                    <td className="px-6 py-4 text-center text-gray-800">{premiumRecipeCount}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-gray-800">Premium Recipes</td>
                    <td className="px-6 py-4 text-center text-gray-800">❌</td>
                    <td className="px-6 py-4 text-center text-gray-800">✅</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-gray-800">Priority Support</td>
                    <td className="px-6 py-4 text-center text-gray-800">❌</td>
                    <td className="px-6 py-4 text-center text-gray-800">✅</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}