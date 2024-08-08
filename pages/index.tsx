import React from "react";
import FileUpload from "../components/uploadForm/FileUpload";
import Header from "../components/header/Header";
import "tailwindcss/tailwind.css";
import Footer from "../components/footer/Footer";
import { AuthProvider } from "../context/AuthContext";

function HomePage() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow pt-16"> {/* Add padding-top to account for fixed header */}
          <div className="container mx-auto px-4 py-8">
            <FileUpload />
          </div>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default HomePage;