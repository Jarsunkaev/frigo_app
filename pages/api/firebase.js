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
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, {
    email,
    subscriptionTier: "free",
    generationsLeft: 2,
    subscriptionId: null,
    lastResetDate: new Date().toISOString()
  });
};

export const getUserData = async (userId) => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data();
  } else {
    console.log("No such user!");
    return null;
  }
};

export const updateUserSubscription = async (userId, subscriptionTier, subscriptionId) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    subscriptionTier,
    subscriptionId,
    generationsLeft: subscriptionTier === "premium" ? 15 : 2,
    lastResetDate: new Date().toISOString()
  });
};

export const decrementGenerations = async (userId) => {
  const userRef = doc(db, "users", userId);
  const userData = await getUserData(userId);
  
  if (userData && userData.generationsLeft > 0) {
    await updateDoc(userRef, {
      generationsLeft: userData.generationsLeft - 1
    });
    return true;
  }
  return false;
};

export const resetGenerations = async (userId) => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  
  const now = new Date();
  
  if (!userSnap.exists()) {
    // If the user document doesn't exist, create it
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
  }
};

// Export all initialized services and functions
export { app, auth, db, googleProvider };
