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
        <main className="flex-grow mt-20">
          <FileUpload />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default HomePage;
