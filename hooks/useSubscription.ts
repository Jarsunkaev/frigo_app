// hooks/useSubscription.ts
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../pages/api/firebase';
import { doc, getDoc, getFirestore, onSnapshot } from 'firebase/firestore';
import { getUserSubscriptionStatus } from '../pages/api/firebase';

export function useSubscription() {
  const [user] = useAuthState(auth);
  const [subscription, setSubscription] = useState<{
    tier: 'free' | 'premium';
    limits: {
      maxGenerations: number;
      maxSuggestions: number;
      maxRecipes: number;
    };
    generationsLeft: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();
  
  // Add refresh capability
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Function to force a refresh
  const refreshSubscription = () => {
    console.log('Forcing subscription data refresh');
    setRefreshCounter(Date.now()); // Use timestamp for more reliable refresh
  };

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    // Function to fetch subscription with direct document read
    const fetchSubscriptionStatus = async () => {
      try {
        // First, directly read user document for freshest data
        const userRef = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userRef);
        
        if (!userSnapshot.exists()) {
          throw new Error('User document not found');
        }
        
        const userData = userSnapshot.data();
        console.log('Direct user data read:', {
          uid: user.uid,
          dailyGenerations: userData.dailyGenerations,
          tier: userData.subscriptionTier
        });
        
        // Calculate remaining generations directly from document
        const subscriptionTier = userData.subscriptionTier?.toLowerCase() || 'free';
        const dailyGenerations = userData.dailyGenerations || 0;
        const maxGenerations = subscriptionTier === 'premium' ? 10 : 1;
        const remainingGenerations = Math.max(0, maxGenerations - dailyGenerations);
        
        // Set subscription using values from direct read
        const maxRecipes = subscriptionTier === 'premium' ? 25 : 6;
        
        setSubscription({
          tier: subscriptionTier,
          limits: {
            maxGenerations: maxGenerations,
            maxSuggestions: subscriptionTier === 'premium' ? 25 : 6,
            maxRecipes: maxRecipes
          },
          generationsLeft: remainingGenerations
        });
        
        console.log(`User has ${remainingGenerations} generations left (used ${dailyGenerations}/${maxGenerations})`);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching subscription status:', error);
        setSubscription({
          tier: 'free',
          limits: { 
            maxGenerations: 1,
            maxSuggestions: 6,
            maxRecipes: 6
          },
          generationsLeft: 1
        });
        setLoading(false);
      }
    };

    // Initial fetch
    fetchSubscriptionStatus();

    // Set up real-time listener with immediate refresh
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        console.log('Firestore update detected - refreshing subscription');
        fetchSubscriptionStatus();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user, db, refreshCounter]);

  const isPremium = subscription?.tier === 'premium';
  return { isPremium, subscription, loading, refreshSubscription };
}