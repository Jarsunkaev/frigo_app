import { signInWithPopup, GoogleAuthProvider, getAuth } from "firebase/auth";
import { auth as firebaseAuth } from "../pages/api/firebase";

const auth = getAuth();
const googleProvider = new GoogleAuthProvider();

export const handleGoogleAuth = async () => {
  console.log("Starting Google auth...");
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google auth completed successfully", result.user);
    return result.user;
  } catch (error) {
    console.error("Google auth error:", error);
    if (error.code === 'auth/popup-closed-by-user') {
      console.log("User closed the popup");
    } else if (error.code === 'auth/popup-blocked') {
      console.log("Popup was blocked by the browser");
    }
    throw error;
  }
};

export const checkAuthState = (callback) => {
  return auth.onAuthStateChanged((user) => {
    console.log("Auth state changed", user ? "User logged in" : "User logged out");
    callback(user);
  });
};

export const signOut = async () => {
  try {
    await auth.signOut();
    console.log("User signed out successfully");
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};