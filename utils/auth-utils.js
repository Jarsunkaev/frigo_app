import { signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { auth, googleProvider } from "../pages/api/firebase";

export const isMobile = () => {
  const userAgent = typeof window.navigator === "undefined" ? "" : navigator.userAgent;
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(userAgent);
};

export const handleGoogleAuth = async (router) => {
  try {
    if (isMobile()) {
      await signInWithRedirect(auth, googleProvider);
    } else {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Successful Google auth", result.user);
      router.push("/generate");
    }
  } catch (error) {
    console.error("Google auth error:", error);
    alert(`Google auth error: ${error.message}`);
  }
};

export const handleRedirectResult = async (router) => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      console.log("Successful Google auth after redirect", result.user);
      router.push("/generate");
    }
  } catch (error) {
    console.error("Error handling redirect result:", error);
    alert(`Authentication error: ${error.message}`);
  }
};