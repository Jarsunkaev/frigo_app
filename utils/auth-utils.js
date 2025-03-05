// utils/auth-utils.js - Updated to ensure Google auth users get Stripe customer IDs
import { 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc,
  getFirestore, 
  serverTimestamp 
} from "firebase/firestore";
import { auth } from "../pages/api/firebase";

const db = getFirestore();

export const createStripeCustomer = async (userId, email) => {
  try {
    // First check if user already has a stripeCustomerId
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists() && userDoc.data().stripeCustomerId) {
      console.log(`User ${userId} already has Stripe customer ID: ${userDoc.data().stripeCustomerId}`);
      return userDoc.data().stripeCustomerId;
    }
    
    // Call an API route to create Stripe customer
    const response = await fetch('/api/create-stripe-customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId, 
        email,
        source: 'firebase-signup'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create Stripe customer');
    }

    const data = await response.json();
    console.log(`Created Stripe customer for user ${userId}: ${data.customerId}`);
    return data.customerId;
  } catch (error) {
    console.error(`Error creating Stripe customer for user ${userId}:`, error);
    throw error;
  }
};

export const createUserDocument = async (user, additionalData = {}) => {
  if (!user.email) {
    console.error('No email provided for user creation');
    throw new Error('Email is required for user creation');
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    
    // Check if user document already exists
    if (userDoc.exists()) {
      console.log(`User document already exists for ${user.uid}`);
      
      // If the user doesn't have a stripeCustomerId, create one
      if (!userDoc.data().stripeCustomerId) {
        try {
          const stripeCustomerId = await createStripeCustomer(user.uid, user.email);
          await setDoc(userRef, { 
            stripeCustomerId,
            updatedAt: serverTimestamp()
          }, { merge: true });
          console.log(`Added Stripe customer ID to existing user ${user.uid}`);
        } catch (stripeError) {
          console.error('Failed to create Stripe customer for existing user:', stripeError);
        }
      }
      
      return userDoc.data();
    }
    
    // Prepare base user data for new user
    const userData = {
      email: user.email,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      subscriptionTier: 'free',
      subscriptionId: null,
      stripeCustomerId: null,
      dailyGenerations: 0,
      lastGenerationDate: new Date().toISOString(),
      lastResetDate: new Date().toISOString(),
      createdAt: serverTimestamp(),
      subscriptionStatus: 'active',
      trialEndDate: null,
      lastPaymentStatus: null,
      lastPaymentDate: null,
      ...additionalData
    };

    // Create user document
    await setDoc(userRef, userData, { merge: true });
    console.log(`Created new user document for ${user.uid}`);

    // Create usage statistics subcollection
    const statisticsRef = doc(db, "users", user.uid, "usage", "statistics");
    await setDoc(statisticsRef, {
      totalGenerations: 0,
      totalRecipesSaved: 0,
      lastUsageDate: serverTimestamp(),
      createdAt: serverTimestamp()
    }, { merge: true });

    // Attempt to create Stripe customer
    try {
      const stripeCustomerId = await createStripeCustomer(user.uid, user.email);
      
      // Update user document with Stripe customer ID
      await setDoc(userRef, { 
        stripeCustomerId 
      }, { merge: true });
      console.log(`Added Stripe customer ID to new user ${user.uid}`);

    } catch (stripeError) {
      console.error('Failed to create Stripe customer:', stripeError);
      // Non-fatal, so we continue
    }

    return userData;
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
};

export const handleEmailSignUp = async (email, password) => {
  try {
    // Create user with Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user document in Firestore
    await createUserDocument(userCredential.user);
    
    return userCredential.user;
  } catch (error) {
    console.error('Email sign-up error:', error);
    throw error;
  }
};

export const handleGoogleAuth = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    // Sign in with Google
    const userCredential = await signInWithPopup(auth, provider);
    
    // Create or update user document
    await createUserDocument(userCredential.user);
    
    return userCredential.user;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

export const checkAuthState = (callback) => {
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Ensure user document exists and has Stripe customer ID
      await createUserDocument(user);
    }
    callback(user);
  });

  return unsubscribe;
};