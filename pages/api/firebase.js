import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

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

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Initialize GoogleAuthProvider
const googleProvider = new GoogleAuthProvider();

// Configure GoogleAuthProvider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// User management functions
export const createUser = async (userId, email) => {
  console.log(`Creating user: ${userId}`);
  const userRef = doc(db, "users", userId);
  try {
    await setDoc(userRef, {
      email,
      subscriptionTier: "free",
      generationsLeft: 2,
      subscriptionId: null,
      lastResetDate: new Date().toISOString()
    });
    console.log(`User created successfully: ${userId}`);
  } catch (error) {
    console.error(`Error creating user: ${userId}`, error);
    throw error;
  }
};

export const getUserData = async (userId) => {
  console.log(`Fetching user data: ${userId}`);
  const userRef = doc(db, "users", userId);
  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      console.log(`User data fetched: ${userId}`, userData);
      return userData;
    } else {
      console.log(`No user found: ${userId}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching user data: ${userId}`, error);
    throw error;
  }
};

export const updateUserSubscription = async (userId, subscriptionTier, subscriptionId) => {
  console.log(`Updating user subscription: ${userId} to ${subscriptionTier}`);
  const userRef = doc(db, "users", userId);
  try {
    await updateDoc(userRef, {
      subscriptionTier,
      subscriptionId,
      generationsLeft: subscriptionTier === "premium" ? 15 : 2,
      lastResetDate: new Date().toISOString()
    });
    console.log(`User subscription updated: ${userId}`);
  } catch (error) {
    console.error(`Error updating user subscription: ${userId}`, error);
    throw error;
  }
};

export const decrementGenerations = async (userId) => {
  console.log(`Decrementing generations for user: ${userId}`);
  const userRef = doc(db, "users", userId);
  try {
    const userData = await getUserData(userId);
    if (userData && userData.generationsLeft > 0) {
      await updateDoc(userRef, {
        generationsLeft: userData.generationsLeft - 1
      });
      console.log(`Generations decremented for user: ${userId}`);
      return true;
    }
    console.log(`No generations left for user: ${userId}`);
    return false;
  } catch (error) {
    console.error(`Error decrementing generations: ${userId}`, error);
    throw error;
  }
};

export const resetGenerations = async (userId) => {
  console.log(`Resetting generations for user: ${userId}`);
  const userRef = doc(db, "users", userId);
  try {
    const userSnap = await getDoc(userRef);
    const now = new Date();
    
    if (!userSnap.exists()) {
      console.log(`User not found, creating new user: ${userId}`);
      await setDoc(userRef, {
        subscriptionTier: "free",
        generationsLeft: 2,
        lastResetDate: now.toISOString()
      });
      return;
    }
    
    const userData = userSnap.data();
    const lastReset = userData.lastResetDate ? new Date(userData.lastResetDate) : new Date(0);
    
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      await updateDoc(userRef, {
        generationsLeft: userData.subscriptionTier === "premium" ? 15 : 2,
        lastResetDate: now.toISOString()
      });
      console.log(`Generations reset for user: ${userId}`);
    } else {
      console.log(`No reset needed for user: ${userId}`);
    }
  } catch (error) {
    console.error(`Error resetting generations: ${userId}`, error);
    throw error;
  }
};

export const cancelUserSubscription = async (userId) => {
  console.log(`Cancelling subscription for user: ${userId}`);
  const userRef = doc(db, "users", userId);
  try {
    await updateDoc(userRef, {
      subscriptionTier: "free",
      subscriptionId: null,
      generationsLeft: 2
    });
    console.log(`Subscription cancelled for user: ${userId}`);
  } catch (error) {
    console.error(`Error cancelling subscription: ${userId}`, error);
    throw error;
  }
};

export const updatePaymentStatus = async (userId, succeeded) => {
  console.log(`Updating payment status for user: ${userId}, succeeded: ${succeeded}`);
  const userRef = doc(db, "users", userId);
  try {
    const userData = await getUserData(userId);
    if (userData) {
      if (succeeded) {
        await updateDoc(userRef, {
          generationsLeft: userData.subscriptionTier === "premium" ? 15 : 2
        });
        console.log(`Payment succeeded, updated generations for user: ${userId}`);
      } else {
        console.log(`Payment failed for user: ${userId}`);
        // You could potentially downgrade the user to free tier here if needed
      }
    }
  } catch (error) {
    console.error(`Error updating payment status: ${userId}`, error);
    throw error;
  }
};

// Export all initialized services and functions
export { app, auth, db, googleProvider };