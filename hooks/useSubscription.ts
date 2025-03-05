// hooks/useSubscription.ts
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../pages/api/firebase';
import { doc, getFirestore, onSnapshot } from 'firebase/firestore';
import { getUserSubscriptionStatus } from '../pages/api/firebase';

export function useSubscription() {
  const [user] = useAuthState(auth);
  const [subscription, setSubscription] = useState<{
    tier: 'free' | 'premium';
    limits: {
      maxGenerations: number;
      maxSuggestions: number;
      maxRecipes: number; // Added maxRecipes for recipe count
    };
    generationsLeft: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    // Function to fetch and set subscription status
    const fetchSubscriptionStatus = async () => {
      try {
        const status = await getUserSubscriptionStatus(user.uid);
        
        // Determine number of recipes based on subscription tier
        const maxRecipes = status.subscriptionTier === 'premium' ? 25 : 6;
        
        setSubscription({
          tier: status.subscriptionTier,
          limits: {
            maxGenerations: status.limits.maxGenerations,
            maxSuggestions: status.limits.maxSuggestions,
            maxRecipes: maxRecipes // Set maxRecipes based on tier
          },
          generationsLeft: status.limits.remainingGenerations
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching subscription status:', error);
        setSubscription({
          tier: 'free',
          limits: { 
            maxGenerations: 3, 
            maxSuggestions: 6,
            maxRecipes: 6 // Default for free tier
          },
          generationsLeft: 3
        });
        setLoading(false);
      }
    };

    // Initial fetch
    fetchSubscriptionStatus();

    // Set up real-time listener for user document
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, async (snapshot) => {
      fetchSubscriptionStatus();
    });

    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, [user, db]);

  const isPremium = subscription?.tier === 'premium';
  return { isPremium, subscription, loading };
}