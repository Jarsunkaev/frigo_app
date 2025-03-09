// firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  deleteDoc, 
  serverTimestamp,
  collection,
  getDocs,
  addDoc,
  increment
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5-rqNltV7_WL1fUB3BBrjy_bm_5XUbao",
  authDomain: "frigo-1b57c.firebaseapp.com",
  projectId: "frigo-1b57c",
  storageBucket: "frigo-1b57c.appspot.com",
  messagingSenderId: "295100988052",
  appId: "1:295100988052:web:410c7293e496deab0e9281",
  measurementId: "G-WKM95V7K81",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Configure GoogleAuthProvider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// User management functions
export const createUser = async (userId: string, email: string) => {
  console.log(`Creating user: ${userId}`);
  const userRef = doc(db, "users", userId);
  
  try {
    // Initialize user with subscription data
    await setDoc(userRef, {
      email,
      subscriptionTier: "free",
      subscriptionId: null,
      stripeCustomerId: null,
      dailyGenerations: 0,
      lastGenerationDate: new Date().toISOString(),
      lastResetDate: new Date().toISOString(),
      createdAt: serverTimestamp(),
      // Subscription fields
      subscriptionStatus: "active",
      trialEndDate: null,
      lastPaymentStatus: null,
      lastPaymentDate: null
    });

    // Initialize usage tracking
    await setDoc(doc(db, "users", userId, "usage", "statistics"), {
      totalGenerations: 0,
      totalRecipesSaved: 0,
      lastUsageDate: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    console.log(`User created successfully: ${userId}`);
  } catch (error) {
    console.error(`Error creating user: ${userId}`, error);
    throw error;
  }
};

export const getUserData = async (userId: string, cacheBuster?: number) => {
  console.log(`Fetching user data: ${userId}${cacheBuster ? ` (cache: ${cacheBuster})` : ''}`);
  const userRef = doc(db, "users", userId);
  
  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      
      // Check if we need to reset daily generations
      const now = new Date();
      const lastReset = new Date(userData.lastResetDate);
      
      if (now.getDate() !== lastReset.getDate() || 
          now.getMonth() !== lastReset.getMonth() || 
          now.getFullYear() !== lastReset.getFullYear()) {
        
        // Reset daily generations
        await updateDoc(userRef, {
          dailyGenerations: 0,
          lastResetDate: now.toISOString()
        });
        
        userData.dailyGenerations = 0;
        userData.lastResetDate = now.toISOString();
      }

      console.log(`User data fetched: ${userId}`, { 
        dailyGenerations: userData.dailyGenerations,
        subscriptionTier: userData.subscriptionTier 
      });
      return userData;
    }
    
    console.log(`No user found: ${userId}`);
    return null;
  } catch (error) {
    console.error(`Error fetching user data: ${userId}`, error);
    throw error;
  }
};

// Subscription management functions
export const updateUserSubscription = async (
  userId: string,
  subscriptionTier: 'free' | 'premium',
  subscriptionId: string | null,
  stripeCustomerId?: string
) => {
  console.log(`Updating subscription: ${userId} to ${subscriptionTier}`);
  const userRef = doc(db, "users", userId);
  
  try {
    const updateData: any = {
      subscriptionTier,
      subscriptionId,
      subscriptionStatus: 'active', // Always set to active when updating subscription
      dailyGenerations: 0,
      lastResetDate: new Date().toISOString(),
      lastUpdated: serverTimestamp()
    };

    if (stripeCustomerId) {
      updateData.stripeCustomerId = stripeCustomerId;
    }

    if (subscriptionTier === 'premium') {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 3);
      updateData.trialEndDate = trialEnd.toISOString();
    }

    await updateDoc(userRef, updateData);

    // Create audit log
    await createAuditLog(userId, 'subscription_updated', {
      type: subscriptionTier === 'premium' ? 'upgrade' : 'downgrade',
      subscriptionId,
      stripeCustomerId
    });

    // Log subscription change
    await addDoc(collection(db, "users", userId, "subscriptionHistory"), {
      type: subscriptionTier === 'premium' ? 'upgrade' : 'downgrade',
      timestamp: serverTimestamp(),
      subscriptionId,
      stripeCustomerId,
      status: 'active'
    });

    console.log(`Subscription updated: ${userId}`);
  } catch (error) {
    console.error(`Error updating subscription: ${userId}`, error);
    throw error;
  }
};

export const getUserSubscriptionStatus = async (userId: string, cacheBuster?: number) => {
  try {
    // Using cacheBuster parameter to ensure we get fresh data
    const userData = await getUserData(userId, cacheBuster);
    if (!userData) {
      throw new Error('User not found');
    }

    // Determine if subscription is active
    const isActive = userData.subscriptionStatus === 'active';
    const subscriptionTier = userData.subscriptionTier?.toLowerCase() || 'free';

    // Check trial status
    const now = new Date();
    const trialEnd = userData.trialEndDate ? new Date(userData.trialEndDate) : null;
    const isInTrial = trialEnd ? now < trialEnd : false;

    // Calculate remaining generations correctly
    const dailyGenerations = userData.dailyGenerations || 0;
    const maxGenerations = subscriptionTier === 'premium' ? 10 : 1;
    const remainingGenerations = Math.max(0, maxGenerations - dailyGenerations);

    // Always log this for debugging
    console.log(`User ${userId} has ${remainingGenerations} generations left (${dailyGenerations}/${maxGenerations} used)`);

    const limits = {
      maxGenerations: maxGenerations,
      maxSuggestions: subscriptionTier === 'premium' ? 25 : 6,
      remainingGenerations: remainingGenerations
    };

    return {
      ...userData,
      subscriptionTier,
      isActive,
      isInTrial,
      limits,
      subscriptionStatus: isActive ? 'active' : 'inactive'
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    throw error;
  }
};

export const createOrUpdateUser = async (userId: string, email: string) => {
  console.log(`Creating/Updating user: ${userId}`);
  const userRef = doc(db, "users", userId);
  
  try {
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Create new user
      await setDoc(userRef, {
        email,
        subscriptionTier: "free",
        subscriptionId: null,
        stripeCustomerId: null,
        dailyGenerations: 0,
        lastGenerationDate: new Date().toISOString(),
        lastResetDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        subscriptionStatus: "active", // Default to active for free tier
        trialEndDate: null,
        lastPaymentStatus: null,
        lastPaymentDate: null
      });

      await setDoc(doc(db, "users", userId, "usage", "statistics"), {
        totalGenerations: 0,
        totalRecipesSaved: 0,
        lastUsageDate: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      console.log(`User created successfully: ${userId}`);
    } else {
      // Update existing user if needed
      const userData = userSnap.data();
      if (!userData.subscriptionStatus) {
        await updateDoc(userRef, {
          subscriptionStatus: "active",
          lastUpdated: serverTimestamp()
        });
      }
    }

    // Create audit log
    await createAuditLog(userId, 'user_created_or_updated', {
      email,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Error in createOrUpdateUser: ${userId}`, error);
    throw error;
  }
};


export const cancelUserSubscription = async (userId: string) => {
  console.log(`Cancelling subscription: ${userId}`);
  const userRef = doc(db, "users", userId);
  
  try {
    await updateDoc(userRef, {
      subscriptionTier: 'free',
      subscriptionId: null,
      subscriptionStatus: 'cancelled',
      dailyGenerations: 0,
      lastResetDate: new Date().toISOString(),
      trialEndDate: null
    });

    // Log cancellation
    await addDoc(collection(db, "users", userId, "subscriptionHistory"), {
      type: 'cancellation',
      timestamp: serverTimestamp()
    });

    console.log(`Subscription cancelled: ${userId}`);
  } catch (error) {
    console.error(`Error cancelling subscription: ${userId}`, error);
    throw error;
  }
};

export const checkAndUpdateGenerationLimit = async (userId: string): Promise<boolean> => {
  const userRef = doc(db, "users", userId);
  
  try {
    // First, try to reset if it's a new day
    await resetDailyGenerations(userId);

    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        dailyGenerations: 0,
        lastResetDate: new Date().toISOString()
      });
    }

    const userData = userDoc.data();
    const dailyGenerations = userData.dailyGenerations || 0;
    const subscriptionTier = userData.subscriptionTier?.toLowerCase() || 'free';
    const maxGenerations = subscriptionTier === 'premium' ? 10 : 1;

    if (dailyGenerations >= maxGenerations) {
      return false;
    }

    // Increment generation count
    await updateDoc(userRef, {
      dailyGenerations: increment(1),
      lastGenerationDate: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error checking generation limit:', error);
    throw error;
  }
};

export const resetDailyGenerations = async (userId: string) => {
  const userRef = doc(db, "users", userId);
  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return;

    const userData = userDoc.data();
    const lastResetDate = userData.lastResetDate ? new Date(userData.lastResetDate) : null;
    const now = new Date();

    // Reset if there's no last reset date or if it's a different day
    if (!lastResetDate || lastResetDate.toDateString() !== now.toDateString()) {
      await updateDoc(userRef, {
        dailyGenerations: 0,
        lastResetDate: now.toISOString()
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error resetting daily generations:', error);
    return false;
  }
};


// Payment status functions
export const updatePaymentStatus = async (userId: string, succeeded: boolean) => {
  console.log(`Updating payment status: ${userId}, succeeded: ${succeeded}`);
  const userRef = doc(db, "users", userId);
  
  try {
    const updateData: any = {
      lastPaymentStatus: succeeded ? 'succeeded' : 'failed',
      lastPaymentDate: serverTimestamp()
    };

    if (!succeeded) {
      updateData.subscriptionTier = 'free';
      updateData.subscriptionId = null;
      updateData.subscriptionStatus = 'payment_failed';
    }

    await updateDoc(userRef, updateData);

    // Log payment status
    await addDoc(collection(db, "users", userId, "paymentHistory"), {
      status: succeeded ? 'succeeded' : 'failed',
      timestamp: serverTimestamp()
    });

    console.log(`Payment status updated: ${userId}`);
  } catch (error) {
    console.error(`Error updating payment status: ${userId}`, error);
    throw error;
  }
};

// Recipe management
export const saveRecipe = async (userId: string, recipe: any) => {
  console.log(`Saving recipe for user: ${userId}`);
  try {
    const recipeRef = doc(db, "users", userId, "savedRecipes", recipe.id.toString());
    await setDoc(recipeRef, {
      ...recipe,
      savedAt: serverTimestamp()
    });

    // Update usage statistics
    const statsRef = doc(db, "users", userId, "usage", "statistics");
    await updateDoc(statsRef, {
      totalRecipesSaved: increment(1)
    });

    console.log(`Recipe saved successfully: ${userId}`);
  } catch (error) {
    console.error(`Error saving recipe: ${userId}`, error);
    throw error;
  }
};

export async function createAuditLog(
  userId: string,
  action: string,
  data: Record<string, any>
) {
  try {
    const auditLogRef = collection(db, 'auditLogs');
    await addDoc(auditLogRef, {
      userId,
      action,
      data,
      timestamp: serverTimestamp(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw - we don't want audit log errors to break the main flow
  }
}

export { app, auth, db, googleProvider };