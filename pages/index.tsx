import React, { useState, useRef, useEffect } from 'react';
import { Camera, ChefHat, Check, Menu, X } from 'lucide-react';

const PlanCard = ({ title, price, features, isPopular }) => (
  <div className={`bg-white rounded-xl shadow-lg p-6 flex flex-col ${isPopular ? 'border-2 border-amber-500' : ''}`}>
    <h3 className="text-2xl font-bold mb-4">{title}</h3>
    <p className="text-4xl font-bold mb-6">{price}</p>
    <ul className="flex-grow">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center mb-2">
          <Check className="text-green-500 mr-2" size={20} />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    <button className={`mt-6 py-2 px-4 rounded-full font-bold ${isPopular ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
      Choose Plan
    </button>
  </div>
);

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const plansRef = useRef(null);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const scrollToPlans = () => {
    plansRef.current.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const toggleMenu = () => setIsMenuOpen((prevState) => !prevState);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div className="bg-gradient-to-b from-amber-50 to-amber-100 min-h-screen font-['DM_Sans']">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <svg className="absolute top-0 left-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#193722" strokeWidth="0.5" strokeOpacity="0.1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <path d="M0 40 Q 20 20, 40 40 T 80 40 T 120 40 T 160 40 T 200 40" fill="none" stroke="#10B981" strokeWidth="2" strokeOpacity="0.2">
            <animate attributeName="d" dur="10s" repeatCount="indefinite" values="
              M0 40 Q 20 20, 40 40 T 80 40 T 120 40 T 160 40 T 200 40;
              M0 40 Q 20 60, 40 40 T 80 40 T 120 40 T 160 40 T 200 40;
              M0 40 Q 20 20, 40 40 T 80 40 T 120 40 T 160 40 T 200 40" />
          </path>
        </svg>
      </div>

      <header className="bg-white bg-opacity-80 backdrop-filter backdrop-blur-lg fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center">
            <a href="/" className="text-3xl font-bold text-[#193722] mr-2">Frigo</a>
            <img src="favicon.ico" className="h-8 w-8" alt="logo" />
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="/" className="nav-item">Home</a>
            <a href="/generate" className="nav-item">Generate</a>
            <a href="/about" className="nav-item">About</a>
            <a href="/" className="nav-item" onClick={(e) => { e.preventDefault(); scrollToPlans(); }}>Pricing</a>
            <a href="/login" className="nav-item">Login</a>
            <a href="/register" className="nav-item">Signup</a>
          </nav>
          <div className="md:hidden">
            <button
              ref={buttonRef}
              onClick={toggleMenu}
              className="flex items-center px-3 py-2 rounded text-[#193722] hover:text-amber-500"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        <div className="header-fade"></div>
      </header>

      {isMenuOpen && (
        <div ref={menuRef} className="md:hidden fixed inset-0 z-40 bg-white bg-opacity-95 backdrop-filter backdrop-blur-lg">
          <div className="flex flex-col h-screen justify-center items-center space-y-8 p-4">
            <a href="/" className="nav-item text-2xl" onClick={() => setIsMenuOpen(false)}>Home</a>
            <a href="/generate" className="nav-item text-2xl" onClick={() => setIsMenuOpen(false)}>Generate</a>
            <a href="/about" className="nav-item text-2xl" onClick={() => setIsMenuOpen(false)}>About</a>
            <a href="/" className="nav-item text-2xl" onClick={(e) => { e.preventDefault(); scrollToPlans(); }}>Pricing</a>
            <a href="/login" className="nav-item text-2xl" onClick={() => setIsMenuOpen(false)}>Login</a>
            <a href="/register" className="nav-item text-2xl text-amber-500" onClick={() => setIsMenuOpen(false)}>Signup</a>
          </div>
        </div>
      )}

      <main className="pt-24">
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl font-bold mb-6 text-[#193722]">
            Turn Your Fridge into a Recipe Goldmine
          </h1>
          <p className="text-xl mb-12 max-w-2xl mx-auto text-[#193722]">
            Snap a photo of your ingredients, and let Frigo work its magic to generate delicious recipes tailored just for you!
          </p>
          <div className="flex justify-center space-x-4">
            <button onClick={scrollToPlans} className="bg-amber-500 text-white py-3 px-6 rounded-full font-bold hover:bg-amber-600 transition duration-300">
              Get Started
            </button>
            <a href="/about" className="bg-white text-amber-500 py-3 px-6 rounded-full font-bold hover:bg-gray-100 transition duration-300">
              Learn More
            </a>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-[#193722]">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Camera, title: "Snap a Photo", description: "Take a picture of your fridge or pantry contents" },
                { icon: ChefHat, title: "Get Recipes", description: "Our AI generates recipes based on your ingredients" },
                { icon: Check, title: "Cook & Enjoy", description: "Follow the recipe and enjoy your delicious meal" }
              ].map((step, index) => (
                <div key={index} className="text-center">
                  <div className="bg-amber-100 rounded-full p-6 inline-block mb-4">
                    <step.icon size={48} className="text-amber-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section ref={plansRef} className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-[#193722]">Choose Your Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <PlanCard
                title="Free"
                price="$0/month"
                features={[
                  "2 recipe generations per day",
                  "Basic ingredient recognition",
                  "Standard recipe suggestions"
                ]}
              />
              <PlanCard
                title="Premium"
                price="$5/month"
                features={[
                  "15 recipe generations per day",
                  "Advanced ingredient recognition",
                  "Personalized recipe suggestions",
                  "Exclusive recipes"
                ]}
                isPopular={true}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#193722] text-white py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="text-2xl font-bold mb-4 md:mb-0">Frigo</div>
          <nav className="flex flex-wrap justify-center md:justify-end space-x-6">
            <a href="#" className="hover:text-amber-500 transition duration-300">Privacy Policy</a>
            <a href="#" className="hover:text-amber-500 transition duration-300">Terms of Service</a>
            <a href="#" className="hover:text-amber-500 transition duration-300">Contact Us</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;