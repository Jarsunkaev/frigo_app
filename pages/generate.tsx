import React from "react";
import FileUpload from "../components/uploadForm/FileUpload";
import Header from "../components/header/Header";
import "tailwindcss/tailwind.css";
import Footer from "../components/footer/Footer";
import { AuthProvider } from "../context/AuthContext";

function HomePage() {
  return (
    <AuthProvider>
      <div className="bg-gradient-to-b from-amber-50 to-amber-100 min-h-screen font-['DM_Sans']">
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <svg className="absolute top-0 left-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#193722" strokeWidth="0.5" strokeOpacity="0.1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="flex flex-col min-h-screen bg-[#fcf9ed]">
          <Header />
          <main className="flex-grow">
            <FileUpload />
          </main>
          <Footer />
        </div>
      </div>
    </AuthProvider>
  );
}

export default HomePage;