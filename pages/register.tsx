import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { useRouter } from "next/router";
import { auth } from "../pages/api/firebase.js";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import { handleGoogleAuth } from "../utils/auth-utils";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log("User signed in after redirect:", result.user);
          router.push("/generate");
        }
      } catch (error) {
        console.error("Error handling redirect result:", error);
      } finally {
        setIsLoading(false);
      }
    };

    handleRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User is signed in:", user);
        router.push("/generate");
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("Account created and user signed in");
    } catch (error) {
      console.error("Sign-up error:", error);
      alert(`Sign-up error: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      await handleGoogleAuth();
    } catch (error) {
      console.error("Google sign-up error:", error);
      alert(`Google sign-up error: ${error.message}`);
      setIsLoading(false);
    }
  };

  const Spinner = () => (
    <div className="flex justify-center items-center mt-4">
      <svg className="w-16 h-16" viewBox="0 0 50 50">
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="#e6f4ea"
          strokeWidth="4"
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="#193722"
          strokeWidth="4"
          strokeDasharray="31.4 31.4"
          strokeLinecap="round"
          transform="rotate(-90 25 25)"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 25 25"
            to="360 25 25"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
        <path
          d="M25 15 L25 20 M25 30 L25 35 M15 25 L20 25 M30 25 L35 25"
          stroke="#193722"
          strokeWidth="4"
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 25 25"
            to="360 25 25"
            dur="6s"
            repeatCount="indefinite"
          />
        </path>
      </svg>
    </div>
  );

  if (isLoading) {
    return <div><Spinner /></div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fcf9ed]">
      <Header />
      <div className="flex-grow flex items-center justify-center px-4">
        <div className="w-full max-w-md p-6 bg-white bg-opacity-40 backdrop-filter backdrop-blur-md rounded-3xl shadow-lg border-2 border-[#193722]">
          <h1 className="text-2xl font-bold text-center mb-6 text-[#193722]">Sign Up</h1>
          <form onSubmit={handleEmailSignUp}>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-[#193722] font-bold mb-2"
              >
                Email Address:
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#193722] focus:outline-none focus:ring-1 focus:ring-[#193722]"
                required
                autoComplete="email"
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-[#193722] font-bold mb-2"
              >
                Password:
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#193722] focus:outline-none focus:ring-1 focus:ring-[#193722]"
                required
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 mb-4 bg-transparent text-[#193722] font-bold rounded-lg border-2 border-[#193722] hover:bg-[#193722] hover:text-white transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#193722]"
            >
              Sign Up with Email
            </button>
          </form>
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>
          <button
            onClick={handleGoogleSignUp}
            className="w-full py-2 bg-white text-gray-700 font-bold rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.3081 10.2303C20.3081 9.55056 20.253 8.86711 20.1354 8.19836H10.7031V12.0492H16.1046C15.8804 13.2911 15.1602 14.3898 14.1057 15.0879V17.5866H17.3282C19.2205 15.8449 20.3081 13.2728 20.3081 10.2303Z" fill="#3F83F8"/>
              <path d="M10.7019 20.0006C13.3989 20.0006 15.6734 19.1151 17.3306 17.5865L14.1081 15.0879C13.2115 15.6979 12.0541 16.0433 10.7056 16.0433C8.09669 16.0433 5.88468 14.2832 5.091 11.9169H1.76562V14.4927C3.46322 17.8695 6.92087 20.0006 10.7019 20.0006V20.0006Z" fill="#34A853"/>
              <path d="M5.08857 11.9169C4.66969 10.6749 4.66969 9.33008 5.08857 8.08811V5.51233H1.76688C0.348541 8.33798 0.348541 11.667 1.76688 14.4927L5.08857 11.9169V11.9169Z" fill="#FBBC04"/>
              <path d="M10.7019 3.95805C12.1276 3.936 13.5055 4.47247 14.538 5.45722L17.393 2.60218C15.5852 0.904587 13.1858 -0.0287217 10.7019 0.000673888C6.92087 0.000673888 3.46322 2.13185 1.76562 5.51234L5.08732 8.08813C5.87733 5.71811 8.09302 3.95805 10.7019 3.95805V3.95805Z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Signup;
