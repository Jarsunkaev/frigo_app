import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/router";
import { auth } from "./api/firebase.js";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      router.push("/");
    } catch (error) {
      console.error("Signup error:", error);
      alert(error.message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fcf9ed]">
      <Header />
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md p-8 bg-white bg-opacity-40 backdrop-filter backdrop-blur-md rounded-3xl shadow-lg border-2 border-[#193722]">
          <h1 className="text-2xl font-bold text-center mb-8 text-[#193722]">Signup</h1>
          <form onSubmit={handleSignup}>
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
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-transparent text-[#193722] font-bold rounded-lg border-2 border-[#193722] hover:bg-[#193722] hover:text-white transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#193722]"
            >
              Signup
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Signup;   