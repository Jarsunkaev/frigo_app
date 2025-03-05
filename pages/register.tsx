// pages/register.tsx - Enhanced with password validation
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { auth } from "../pages/api/firebase";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import { handleEmailSignUp, handleGoogleAuth, checkAuthState } from "../utils/auth-utils";
import { ChevronLeft, Loader, Check, X, Eye, EyeOff, Info } from 'lucide-react';

// Password validation requirements
const passwordRequirements = [
  { id: 'length', label: 'At least 8 characters', test: (password: string) => password.length >= 8 },
  { id: 'lowercase', label: 'Contains lowercase letter', test: (password: string) => /[a-z]/.test(password) },
  { id: 'uppercase', label: 'Contains uppercase letter', test: (password: string) => /[A-Z]/.test(password) },
  { id: 'number', label: 'Contains a number', test: (password: string) => /[0-9]/.test(password) },
  { id: 'special', label: 'Contains a special character', test: (password: string) => /[^A-Za-z0-9]/.test(password) },
];

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0); // 0-4 scale
  const router = useRouter();

  // Calculate password requirement checks
  const passwordChecks = passwordRequirements.map(req => ({
    ...req,
    valid: req.test(password)
  }));
  
  // Check if passwords match
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Calculate password strength based on requirements met
  useEffect(() => {
    const validChecks = passwordChecks.filter(check => check.valid);
    setPasswordStrength(validChecks.length);
    
    // Only show requirements when field is in use
    if (password.length > 0) {
      setShowPasswordRequirements(true);
    }
  }, [password]);

  useEffect(() => {
    const unsubscribe = checkAuthState((user) => {
      if (user) {
        console.log("User already signed in");
        router.push("/generate");
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const validatePassword = () => {
    // Check if passwords match
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return false;
    }
    
    // Check minimum requirements (8 chars + at least 2 other requirements)
    const isLengthValid = password.length >= 8;
    const validRequirements = passwordChecks.filter(check => check.valid).length;
    
    if (!isLengthValid || validRequirements < 3) {
      setError("Password doesn't meet the minimum security requirements");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const user = await handleEmailSignUp(email, password);
      console.log("Successful email sign-up");
      router.push("/generate");
    } catch (error) {
      console.error("Sign-up error:", error);
      setError(getErrorMessage((error as { code: string }).code));
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const user = await handleGoogleAuth();
      if (user) {
        console.log("Successful Google sign-up");
        router.push("/generate");
      } else {
        console.log("Google sign-up failed");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Google sign-up error:", error);
      setError(getErrorMessage((error as { code: string }).code));
      setIsLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled.';
      case 'auth/weak-password':
        return 'Please choose a stronger password.';
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 to-amber-100/50">
      <Header />
      
      <main className="flex-grow flex items-center justify-center px-4 py-16 pt-16 md:pt-16">
        <div className="w-full max-w-md">
          <button
            onClick={() => router.push('/')}
            className="mb-8 flex items-center text-gray-600 hover:text-amber-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to home
          </button>

          <div className="bg-white bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-xl border border-white border-opacity-20 p-6 sm:p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Create an Account</h1>
              <p className="text-gray-600">Join FRIGO today and start cooking smart</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start">
                <X className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
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
                
                {/* Password strength meter */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">Password strength:</span>
                      <span className="text-xs font-medium">
                        {passwordStrength === 0 && "Very weak"}
                        {passwordStrength === 1 && "Weak"}
                        {passwordStrength === 2 && "Fair"}
                        {passwordStrength === 3 && "Good"}
                        {passwordStrength >= 4 && "Strong"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          passwordStrength <= 1 ? "bg-red-500" : 
                          passwordStrength === 2 ? "bg-amber-500" : 
                          passwordStrength === 3 ? "bg-yellow-500" : 
                          "bg-green-500"
                        }`} 
                        style={{ width: `${Math.min((passwordStrength / 5) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Password requirements */}
                {showPasswordRequirements && (
                  <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 mb-2 flex items-center">
                      <Info className="h-3 w-3 mr-1" />
                      Password requirements:
                    </div>
                    <ul className="space-y-1">
                      {passwordChecks.map((req) => (
                        <li key={req.id} className="flex items-start">
                          <span className="mt-0.5 mr-2">
                            {req.valid ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <X className="h-3 w-3 text-gray-300" />
                            )}
                          </span>
                          <span className={`text-xs ${req.valid ? 'text-green-600' : 'text-gray-500'}`}>
                            {req.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      confirmPassword ? (passwordsMatch ? 'border-green-300' : 'border-red-300') : 'border-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                  
                  {confirmPassword && (
                    <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                      {passwordsMatch ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                
                {confirmPassword && !passwordsMatch && (
                  <p className="mt-1 text-xs text-red-500">
                    Passwords don't match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-500 text-white py-3 rounded-lg font-medium hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader className="w-5 h-5 animate-spin mr-2" />
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
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
              onClick={handleGoogleSignUp}
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
              Already have an account?{' '}
              <a
                href="/login"
                className="text-amber-600 hover:text-amber-700 font-medium"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SignUp;