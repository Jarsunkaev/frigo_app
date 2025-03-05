// pages/login.tsx - Enhanced with password validation
import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, User } from "firebase/auth";
import { useRouter } from "next/router";
import { auth } from "../pages/api/firebase";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import { handleGoogleAuth, checkAuthState } from "../utils/auth-utils";
import { ChevronLeft, Loader, Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const router = useRouter();
  const { plan, returnUrl } = router.query;

  useEffect(() => {
    const unsubscribe = checkAuthState((user) => {
      if (user) {
        console.log("User already signed in");
        handlePostSignInRedirect(user);
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handlePostSignInRedirect = (user: User) => {
    if (plan === 'premium' && returnUrl) {
      window.location.href = decodeURIComponent(Array.isArray(returnUrl) ? returnUrl[0] : returnUrl);
    } else {
      router.push("/generate");
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Successful email sign-in");
      setLoginAttempts(0); // Reset login attempts on success
      handlePostSignInRedirect(userCredential.user);
    } catch (error) {
      console.error("Sign-in error:", error);
      setLoginAttempts(prevAttempts => prevAttempts + 1);
      setError(getErrorMessage((error as any).code));
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const user = await handleGoogleAuth();
      if (user) {
        console.log("Successful Google sign-in");
        handlePostSignInRedirect(user);
      } else {
        console.log("Google sign-in failed");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      setError(getErrorMessage((error as any).code));
      setIsLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show a forgot password link after multiple failed attempts
  const showForgotPassword = loginAttempts >= 2;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 to-amber-100/50">
      <Header />
      
      {/* Main content with extra padding for mobile */}
      <main className="flex-grow flex items-center justify-center px-4 py-16 pt-16 md:pt-16">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <button
            onClick={() => router.push('/')}
            className="mb-8 flex items-center text-gray-600 hover:text-amber-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to home
          </button>

          <div className="bg-white bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-xl border border-white border-opacity-20 p-6 sm:p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
              <p className="text-gray-600">Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {plan === 'premium' && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                <p className="text-sm text-amber-700 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-amber-500" />
                  <span>You're about to upgrade to Premium. Please sign in to continue.</span>
                </p>
              </div>
            )}

            <form onSubmit={handleEmailSignIn} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  {showForgotPassword && (
                    <a
                      href="/forgot-password"
                      className="text-sm text-amber-600 hover:text-amber-500"
                    >
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {password && password.length < 6 && (
                  <p className="mt-1 text-xs text-amber-600">
                    Password must be at least 6 characters
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || password.length < 6}
                className="w-full bg-amber-500 text-white py-3 rounded-lg font-medium hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader className="w-5 h-5 animate-spin mr-2" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>

            <p className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <a
                href="/register"
                className="text-amber-600 hover:text-amber-700 font-medium"
              >
                Sign up
              </a>
            </p>
          </div>
          
          {/* Security notice */}
          <div className="mt-6 text-center text-xs text-gray-500 max-w-sm mx-auto">
            <p className="flex items-center justify-center">
              <Shield className="h-3 w-3 mr-1 text-gray-400" />
              Your security is important to us. Never share your password.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SignIn;