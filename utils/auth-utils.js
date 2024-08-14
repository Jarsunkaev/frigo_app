import { signInWithPopup, signInWithRedirect } from "firebase/auth";
import { auth, googleProvider } from "../pages/api/firebase.js";

export const isMobile = () => {
  if (typeof window !== "undefined") {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  return false;
};

export const handleGoogleAuth = async () => {
  try {
    if (isMobile()) {
      await signInWithPopup(auth, googleProvider); // Use signInWithPopup() for mobile
    } else {
      await signInWithRedirect(auth, googleProvider);
    }
  } catch (error) {
    console.error("Google auth error:", error);
    throw error;
  }
};
