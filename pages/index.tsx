import React, { useState, useRef, useEffect } from 'react';
import { Camera, ChefHat, Check, Menu, X, Leaf, DollarSign, Clock } from 'lucide-react';

const Statistic = ({ number, label }) => (
  <div className="text-center px-2 sm:px-4">
    <div className="text-2xl sm:text-4xl font-bold text-amber-500 mb-1 sm:mb-2">{number}</div>
    <div className="text-xs sm:text-sm text-gray-600">{label}</div>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
    <div className="bg-amber-50 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-4">
      <Icon className="text-amber-500" size={20} />
    </div>
    <h3 className="text-lg sm:text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-600 text-sm sm:text-base">{description}</p>
  </div>
);

interface PlanCardProps {
  title: string;
  price: string;
  features: string[];
  isPopular?: boolean;
  onChoosePlan: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ title, price, features, isPopular, onChoosePlan }) => (
  <div className={`bg-white rounded-xl shadow-lg p-4 sm:p-8 flex flex-col relative ${
    isPopular ? 'border-2 border-amber-500 transform hover:-translate-y-2' : 'hover:-translate-y-1'
  } transition-all duration-300`}>
    {isPopular && (
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
        <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap">
          Most Popular
        </span>
      </div>
    )}
    <h3 className="text-xl sm:text-2xl font-bold mb-4">{title}</h3>
    <div className="flex items-baseline mb-6">
      <span className="text-4xl sm:text-5xl font-bold">{price}</span>
      <span className="text-gray-500 ml-2 text-sm sm:text-base">/month</span>
    </div>
    <ul className="flex-grow space-y-3 sm:space-y-4">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start">
          <Check className="text-green-500 mr-2 mt-1 flex-shrink-0" size={16} />
          <span className="text-gray-600 text-sm sm:text-base">{feature}</span>
        </li>
      ))}
    </ul>
    <button 
      onClick={onChoosePlan}
      className={`mt-6 sm:mt-8 py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-bold text-base sm:text-lg w-full ${
        isPopular 
          ? 'bg-amber-500 text-white hover:bg-amber-600' 
          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      } transition duration-300`}
    >
      {isPopular ? 'Start Premium' : 'Start Free'}
    </button>
  </div>
);

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const plansRef = useRef(null);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const toggleMenu = () => setIsMenuOpen((prevState) => !prevState);
  
  const handleChoosePlan = (planType) => {
    // Updated Stripe URL for premium plan
    const stripeCheckoutUrl = 'https://buy.stripe.com/test_28o6qugqF3gp1Lq7su';
    
    if (planType === 'premium') {
      window.location.href = `/login?plan=premium&returnUrl=${encodeURIComponent(stripeCheckoutUrl)}`;
    } else {
      window.location.href = '/login?plan=free';
    }
  };

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
    <div className="bg-gradient-to-b from-amber-50 to-amber-100 min-h-screen font-sans">
      {/* Header */}
      <header className="bg-white bg-opacity-90 backdrop-blur-lg fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-4 sm:py-6 flex justify-between items-center">
          <div className="flex items-center">
            <a href="/" className="text-2xl sm:text-3xl font-bold text-[#193722] mr-2">FRIGO</a>
            <img src="favicon.ico" className="h-6 w-6 sm:h-8 sm:w-8" alt="logo" />
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="/" className="nav-item text-sm">Home</a>
            <a href="/generate" className="nav-item text-sm">Generate</a>
            <a href="/about" className="nav-item text-sm">About</a>
            <a href="/" className="nav-item text-sm" onClick={(e) => { e.preventDefault(); plansRef.current.scrollIntoView({ behavior: 'smooth' }); }}>Pricing</a>
            <a href="/login" className="nav-item text-sm">Login</a>
            <a href="/register" className="nav-item text-sm">Signup</a>
          </nav>
          <button
            ref={buttonRef}
            onClick={toggleMenu}
            className="md:hidden p-2"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div ref={menuRef} className="md:hidden fixed inset-0 z-40 bg-white bg-opacity-95 backdrop-filter backdrop-blur-lg">
          <div className="flex flex-col h-screen justify-center items-center space-y-6 p-4">
            <a href="/" className="text-xl font-medium" onClick={() => setIsMenuOpen(false)}>Home</a>
            <a href="/generate" className="text-xl font-medium" onClick={() => setIsMenuOpen(false)}>Generate</a>
            <a href="/about" className="text-xl font-medium" onClick={() => setIsMenuOpen(false)}>About</a>
            <a href="/" className="text-xl font-medium" onClick={(e) => { e.preventDefault(); plansRef.current.scrollIntoView({ behavior: 'smooth' }); setIsMenuOpen(false); }}>Pricing</a>
            <a href="/login" className="text-xl font-medium" onClick={() => setIsMenuOpen(false)}>Login</a>
            <a href="/register" className="text-xl font-medium text-amber-500" onClick={() => setIsMenuOpen(false)}>Signup</a>
          </div>
        </div>
      )}

      <main className="pt-16 sm:pt-24">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-8 sm:py-16 md:py-24">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="text-center md:text-left">
              <div className="inline-block px-3 py-1 sm:px-4 sm:py-2 bg-amber-100 rounded-full text-amber-600 font-semibold mb-4 sm:mb-6 text-sm sm:text-base">
                🌱 Reduce Food Waste, Save Money
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 text-gray-900 leading-tight">
                Turn Your Kitchen Into a
                <span className="text-amber-500 block sm:inline"> Sustainable Culinary Studio</span>
              </h1>
              <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-gray-600">
                Transform leftover ingredients into delicious, healthy meals. Join thousands of conscious cooks saving money and the planet.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
                <button 
                  onClick={() => plansRef.current && plansRef.current.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-amber-500 text-white py-3 sm:py-4 px-6 sm:px-8 rounded-lg font-bold text-base sm:text-lg hover:bg-amber-600 transition duration-300 w-full sm:w-auto"
                >
                  Start Cooking Smart
                </button>
                <a 
                  href="/demo" 
                  className="bg-white text-amber-500 py-3 sm:py-4 px-6 sm:px-8 rounded-lg font-bold text-base sm:text-lg hover:bg-gray-50 transition duration-300 text-center w-full sm:w-auto"
                >
                  Watch Demo
                </a>
              </div>
              <div className="mt-8 sm:mt-12 flex items-center justify-center md:justify-start space-x-4 sm:space-x-8 overflow-x-auto">
                <Statistic number="50K+" label="Active Users" />
                <div className="hidden sm:block w-px h-12 bg-gray-200" />
                <Statistic number="4.8" label="App Rating" />
                <div className="hidden sm:block w-px h-12 bg-gray-200" />
                <Statistic number="1M+" label="Recipes Created" />
              </div>
            </div>
            <div className="relative mt-8 md:mt-0">
              <div className="absolute -right-4 -bottom-4 w-48 h-48 sm:w-72 sm:h-72 bg-amber-200 rounded-full opacity-50 blur-3xl" />
              <div className="absolute -left-4 -top-4 w-48 h-48 sm:w-72 sm:h-72 bg-green-200 rounded-full opacity-50 blur-3xl" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white py-16 sm:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6">Smart Cooking for Modern Life</h2>
              <p className="text-lg sm:text-xl text-gray-600">
                Discover how Frigo helps you cook smarter, eat healthier, and save money.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              <FeatureCard
                icon={Leaf}
                title="Reduce Food Waste"
                description="Save up to $1500 annually by using ingredients before they spoil"
              />
              <FeatureCard
                icon={ChefHat}
                title="AI-Powered Recipes"
                description="Get personalized recipes based on your dietary preferences and available ingredients"
              />
              <FeatureCard
                icon={Clock}
                title="Quick & Easy"
                description="Generate healthy recipes in seconds, perfect for busy lifestyles"
              />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section ref={plansRef} className="py-16 sm:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6">Simple, Transparent Pricing</h2>
              <p className="text-lg sm:text-xl text-gray-600">
                Start free and upgrade when you're ready. No commitments.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <PlanCard
                title="Free"
                price="$0"
                features={[
                  "3 recipe generations per day",
                  "Basic ingredient recognition",
                  "6 recipe suggestions",
                  "Community recipe sharing",
                  "Basic meal planning"
                ]}
                onChoosePlan={() => handleChoosePlan('free')}
              />
              <PlanCard
                title="Premium"
                price="$2.99"
                features={[
                  "10 recipe generations per day",
                  "Advanced ingredient recognition",
                  "50 recipe suggestions per scan",
                  "Personalized nutrition tracking",
                  "Advanced meal planning",
                  "Priority customer support"
                ]}
                isPopular={true}
                onChoosePlan={() => handleChoosePlan('premium')}
              />
            </div>
          </div>
        </section>
        {/* CTA Section */}
        <section className="py-16 sm:py-24 bg-amber-500">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 sm:mb-8">
              Ready to Transform Your Cooking?
            </h2>
            <p className="text-lg sm:text-xl text-white mb-8 sm:mb-12 max-w-2xl mx-auto">
              Join thousands of smart cooks who are saving money and eating better with Frigo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => plansRef.current.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-amber-500 py-3 sm:py-4 px-6 sm:px-8 rounded-lg font-bold text-base sm:text-lg hover:bg-gray-50 transition duration-300"
              >
                Get Started Free
              </button>
              <a 
                href="/about"
                className="bg-transparent border-2 border-white text-white py-3 sm:py-4 px-6 sm:px-8 rounded-lg font-bold text-base sm:text-lg hover:bg-white hover:text-amber-500 transition duration-300"
              >
                See How It Works
              </a>
            </div>
          </div>
        </section>

        {/* Success Stories Section */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-1 gap-8 items-center">
                <div className="relative">
                  <div className="absolute -bottom-4 w-48 h-48 bg-amber-200 rounded-full opacity-30 blur-2xl" />
                </div>
                <div className="space-y-6">
                  <h2 className="text-3xl -left-4 sm:text-4xl font-bold text-gray-900">
                    See Real Results
                  </h2>
                  <p className="text-lg sm:text-xl text-gray-600">
                    Our users are saving an average of $200 monthly on groceries while reducing their food waste by 60%.
                  </p>
                  <ul className="space-y-4">
                    {[
                      "Reduce monthly food waste",
                      "Save money on groceries",
                      "Eat healthier meals",
                      "Support sustainable cooking"
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="text-green-500 flex-shrink-0" size={24} />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => plansRef.current.scrollIntoView({ behavior: 'smooth' })}
                    className="mt-4 bg-amber-500 text-white py-3 px-6 rounded-lg font-bold hover:bg-amber-600 transition duration-300"
                  >
                    Start Your Journey
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-xl sm:text-2xl font-bold mb-4">Frigo</h3>
              <p className="text-gray-400 text-sm sm:text-base mb-6">
                Making sustainable cooking easy and delicious for everyone.
              </p>
              <div className="flex gap-4">
                {['twitter', 'facebook', 'instagram'].map((social) => (
                  <a 
                    key={social}
                    href={`https://${social}.com`}
                    className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition duration-300"
                  >
                    <span className="sr-only">{social}</span>
                    {/* Replace with actual social icons */}
                    <div className="w-5 h-5 bg-white/20 rounded" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm sm:text-base">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition duration-200">Features</a></li>
                <li><a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition duration-200">Pricing</a></li>
                <li><a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition duration-200">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm sm:text-base">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition duration-200">About</a></li>
                <li><a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition duration-200">Blog</a></li>
                <li><a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition duration-200">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm sm:text-base">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition duration-200">Help Center</a></li>
                <li><a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition duration-200">Contact</a></li>
                <li><a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition duration-200">Privacy</a></li>
                <li><a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition duration-200">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm sm:text-base text-gray-400">
            <p>&copy; {new Date().getFullYear()} Frigo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;