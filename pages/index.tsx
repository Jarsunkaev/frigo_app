import React, { useState, useRef, useEffect } from 'react';
import { Camera, ChefHat, Check, Menu, X, Leaf, DollarSign, Clock, Play, ArrowRight } from 'lucide-react';
import FAQSection from '../components/footer/FAQItem';


const Statistic = ({ number, label }) => (
  <div className="text-center px-2 sm:px-4">
    <div className="text-2xl sm:text-4xl font-bold text-amber-500 mb-1 sm:mb-2">{number}</div>
    <div className="text-xs sm:text-sm text-gray-600">{label}</div>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="feature-card bg-white p-4 sm:p-6 rounded-xl shadow-lg">
    <div className="feature-icon bg-amber-50 w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center mb-4">
      <Icon className="text-amber-500" size={24} />
    </div>
    <h3 className="text-lg sm:text-xl font-bold mb-3">{title}</h3>
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
  <div className={`bg-white rounded-xl shadow-lg p-6 sm:p-8 flex flex-col relative ${
    isPopular ? 'border-2 border-amber-500 transform hover:-translate-y-3' : 'hover:-translate-y-2'
  } transition-all duration-300`}>
    {isPopular && (
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
        <span className="bg-amber-500 text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap shadow-md">
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
          <div className="bg-green-100 rounded-full p-0.5 mt-0.5 mr-2">
            <Check className="text-green-600" size={isPopular ? 18 : 16} />
          </div>
          <span className="text-gray-700 text-sm sm:text-base">{feature}</span>
        </li>
      ))}
    </ul>
    <button 
      onClick={onChoosePlan}
      className={`mt-8 py-3 sm:py-4 px-6 sm:px-8 rounded-lg font-bold text-base sm:text-lg w-full ${
        isPopular 
          ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md hover:shadow-lg' 
          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      } transition duration-300 flex items-center justify-center`}
    >
      {isPopular ? (
        <>
          <span>Start Premium</span>
          <ArrowRight className="ml-2 w-5 h-5" />
        </>
      ) : 'Start Free'}
    </button>
  </div>
);

const VideoPreview = ({ onPlay }) => (
  <div 
    onClick={onPlay}
    className="video-card relative w-full rounded-2xl overflow-hidden cursor-pointer bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200"
  >
    <div className="absolute inset-0 slime-animation opacity-60"></div>
    
    <div className="relative p-1 sm:p-2 h-64 sm:h-80 md:h-96">
      <video
        className="w-full h-full rounded-xl object-cover"
        muted
        loop
        preload="metadata"
        poster="/video-thumbnail.jpg"
      >
        <source src="/tutorial.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="play-button bg-white bg-opacity-90 rounded-full p-4 shadow-lg hover:bg-opacity-100 transition duration-300">
          <Play className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500 ml-1" />
        </div>
      </div>
      
      <div className="absolute bottom-4 left-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm p-4 rounded-lg shadow-md">
        <h3 className="font-bold text-gray-800 text-sm sm:text-base">See FRIGO in action</h3>
        <p className="text-gray-600 text-xs sm:text-sm mt-1">Watch how easy it is to reduce food waste while making delicious meals</p>
      </div>
    </div>
  </div>
);

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const videoRef = useRef(null);
  const plansRef = useRef(null);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const toggleMenu = () => setIsMenuOpen((prevState) => !prevState);
  
  const handleChoosePlan = (planType) => {
    const stripeCheckoutUrl = 'https://buy.stripe.com/test_28o6qugqF3gp1Lq7su';
    if (planType === 'premium') {
      window.location.href = `/login?plan=premium&returnUrl=${encodeURIComponent(stripeCheckoutUrl)}`;
    } else {
      window.location.href = '/login?plan=free';
    }
  };
  
  const handlePlayVideo = () => {
    setShowVideoModal(true);
    // Allow a small delay for the modal to render before playing
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(error => {
          console.log('Autoplay prevented:', error);
          // Most browsers require user interaction to start video playback
        });
      }
    }, 300);
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  return (
<div className="bg-gradient-to-b from-amber-50 to-amber-100/70 min-h-screen font-sans overflow-x-hidden">
{/* Add custom styles */}

      
      {/* Header */}
      <header className="bg-white bg-opacity-90 backdrop-blur-lg fixed top-0 left-0 right-0 z-50 shadow-sm">
          <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 box-border py-4 sm:py-5 flex justify-between items-center">
          <div className="flex items-center">
            <a href="/" className="text-2xl sm:text-3xl font-bold text-[#193722] mr-2">FRIGO</a>
            <img src="favicon.ico" className="h-6 w-6 sm:h-8 sm:w-8" alt="logo" />
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="/" className="nav-item text-sm font-medium">Home</a>
            <a href="/generate" className="nav-item text-sm font-medium">Generate</a>
            <a href="/meal-plan" className="nav-item text-sm font-medium">Meal Planner</a>
            <a href="/about" className="nav-item text-sm font-medium">About</a>
            <a 
              href="/" 
              className="nav-item text-sm font-medium" 
              onClick={(e) => { 
                e.preventDefault(); 
                plansRef.current.scrollIntoView({ behavior: 'smooth' }); 
              }}
            >
              Pricing
            </a>
            <a href="/login" className="nav-item text-sm font-medium">Login</a>
            <a 
              href="/register" 
              className="text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-lg transition-colors duration-300"
            >
              Sign Up
            </a>
          </nav>
          <button
            ref={buttonRef}
            onClick={toggleMenu}
            className="md:hidden p-2"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div 
          ref={menuRef} 
          className="md:hidden fixed inset-0 z-40 bg-white bg-opacity-95 backdrop-filter backdrop-blur-lg"
        >
          <div className="flex flex-col h-screen justify-center items-center space-y-6 p-4">
            <a href="/" className="text-xl font-medium" onClick={() => setIsMenuOpen(false)}>Home</a>
            <a href="/generate" className="text-xl font-medium" onClick={() => setIsMenuOpen(false)}>Generate</a>
            <a href="/meal-plan" className="text-xl font-medium" onClick={() => setIsMenuOpen(false)}>Meal Planner</a>
            <a href="/about" className="text-xl font-medium" onClick={() => setIsMenuOpen(false)}>About</a>
            <a 
              href="/" 
              className="text-xl font-medium" 
              onClick={(e) => { 
                e.preventDefault(); 
                plansRef.current.scrollIntoView({ behavior: 'smooth' }); 
                setIsMenuOpen(false); 
              }}
            >
              Pricing
            </a>
            <a href="/login" className="text-xl font-medium" onClick={() => setIsMenuOpen(false)}>Login</a>
            <a 
              href="/register" 
              className="text-xl font-bold px-6 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors" 
              onClick={() => setIsMenuOpen(false)}
            >
              Sign Up
            </a>
          </div>
        </div>
      )}

      <main className="pt-16 sm:pt-24">
        {/* Hero Section with improved gradient */}
        <section className="relative py-16 sm:py-24 overflow-hidden">
          <div className="absolute inset-0 hero-gradient z-0"></div>
          <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 box-border relative z-10">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 sm:gap-16 items-center">
              {/* Left: Hero Text */}
              <div className="text-center md:text-left">
                <div className="inline-block px-4 py-2 bg-gradient-to-r from-amber-100 to-amber-200 rounded-full text-amber-600 font-semibold mb-6 shadow-sm">
                  🌱 Reduce Food Waste, Save Money
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-gray-900 leading-tight">
                  Turn Your Kitchen Into a
                  <span className="text-amber-500 block sm:inline"> Sustainable Culinary Studio</span>
                </h1>
                <p className="text-lg sm:text-xl mb-8 text-gray-600 max-w-xl">
                  Transform leftover ingredients into delicious, healthy meals. Join thousands of conscious cooks saving money and the planet.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <button 
                    onClick={() => plansRef.current && plansRef.current.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-amber-500 text-white py-3 sm:py-4 px-8 rounded-lg font-bold text-base sm:text-lg hover:bg-amber-600 transition duration-300 shadow-md hover:shadow-lg w-full sm:w-auto flex items-center justify-center"
                  >
                    <span>Start Cooking Smart</span>
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </button>
                  <button 
                    onClick={handlePlayVideo}
                    className="bg-white text-amber-500 py-3 sm:py-4 px-8 rounded-lg font-bold text-base sm:text-lg hover:bg-gray-50 transition duration-300 shadow-sm hover:shadow-md text-center w-full sm:w-auto border border-amber-200"
                  >
                    Watch Demo
                  </button>
                </div>
                
              </div>

              {/* Right: Enhanced Video Preview */}
              <div className="relative">
                <VideoPreview onPlay={handlePlayVideo} />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section with enhanced cards */}
        <section className="py-20 sm:py-28 bg-white">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 box-border">
                <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Smart Cooking for Modern Life</h2>
              <p className="text-lg sm:text-xl text-gray-600">
                Discover how Frigo helps you cook smarter, eat healthier, and save money.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 max-w-6xl mx-auto">
              <FeatureCard
                icon={Leaf}
                title="Reduce Food Waste"
                description="Save up to $1500 annually by using ingredients before they spoil. Make the most of what you already have."
              />
              <FeatureCard
                icon={ChefHat}
                title="AI-Powered Recipes"
                description="Get personalized recipes based on your dietary preferences and available ingredients with advanced AI technology."
              />
              <FeatureCard
                icon={Clock}
                title="Quick & Easy"
                description="Generate healthy recipes in seconds, perfect for busy lifestyles. Save time planning and cooking meals."
              />
            </div>
          </div>
        </section>

        {/* Pricing Section with enhanced cards */}
        <section ref={plansRef} className="py-20 sm:py-28">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 box-border">
          <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Simple, Transparent Pricing</h2>
              <p className="text-lg sm:text-xl text-gray-600">
                Start free and upgrade when you're ready. No commitments or hidden fees.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
              <PlanCard
                title="Free"
                price="$0"
                features={[
                  "1 recipe generation per day",
                  "Basic ingredient recognition",
                  "6 recipe suggestions",
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
                  "25 recipe suggestions per scan",
                  "Personalized nutrition tracking",
                  "Advanced meal planning",
                ]}
                isPopular={true}
                onChoosePlan={() => handleChoosePlan('premium')}
              />
            </div>
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <section className="py-20 sm:py-24 relative overflow-hidden">
          <div className="absolute inset-0 gradient-bg"></div>
          <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 box-border relative z-10">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-10 sm:p-12 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Ready to Transform Your Cooking?
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                Join thousands of smart cooks who are saving money and eating better with Frigo.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button 
                  onClick={() => plansRef.current.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-amber-500 text-white py-4 px-8 rounded-lg font-bold text-lg hover:bg-amber-600 transition duration-300 shadow-md hover:shadow-lg flex items-center justify-center"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="ml-2 w-5 h-5" />
                </button>
                <a 
                  href="/about"
                  className="bg-white text-amber-500 py-4 px-8 rounded-lg font-bold text-lg border border-amber-200 hover:bg-amber-50 transition duration-300 shadow-sm hover:shadow-md"
                >
                  See How It Works
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Success Stories Section - Redesigned */}
        <section className="py-20 sm:py-28 bg-white">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 box-border">
        <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="md:order-2">
                  <div className="relative">
                    <div className="absolute -z-10 -right-10 -bottom-10 w-64 h-64 bg-amber-200 rounded-full opacity-30 blur-3xl"></div>
                    <div className="absolute -z-10 -left-10 -top-10 w-64 h-64 bg-green-200 rounded-full opacity-30 blur-3xl"></div>
                    <img 
                      src="https://images.unsplash.com/photo-1606787366850-de6330128bfc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" 
                      alt="Happy Family Cooking" 
                      className="rounded-2xl shadow-2xl object-cover h-96 w-full"
                    />
                  </div>
                </div>
                
                <div className="space-y-6 md:order-1">
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
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
                      <li key={index} className="flex items-center gap-3 bg-green-50 p-3 rounded-lg shadow-sm">
                        <div className="bg-green-100 rounded-full p-1">
                          <Check className="text-green-600" size={20} />
                        </div>
                        <span className="text-gray-700 font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => plansRef.current.scrollIntoView({ behavior: 'smooth' })}
                    className="mt-6 bg-amber-500 text-white py-3 px-8 rounded-lg font-bold hover:bg-amber-600 transition duration-300 shadow-md hover:shadow-lg flex items-center"
                  >
                    <span>Start Your Journey</span>
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <FAQSection />
      </main>

      {/* Modal for Video Playback - Enhanced */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
            <button 
              onClick={() => setShowVideoModal(false)} 
              className="absolute top-3 right-3 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition z-10 hover:rotate-90 transform duration-300"
              aria-label="Close video"
            >
              <X size={30} />
            </button>
            <video
              ref={videoRef}
              className="w-full h-auto bg-black"
              controls
              autoPlay
              playsInline
              preload="auto"
              src="/tutorial.mp4"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}

      {/* Footer - Enhanced */}
      <footer className="bg-gray-900 text-white py-16 relative overflow-hidden">
  <div className="absolute opacity-5 top-0 right-0 w-96 h-96 bg-amber-500 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
  <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 box-border">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
      <div className="col-span-2 md:col-span-1">
        <h3 className="text-2xl font-bold mb-5 flex items-center">
          Frigo
          <span className="w-2 h-2 bg-amber-500 rounded-full ml-1.5"></span>
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Making sustainable cooking easy and delicious for everyone.
        </p>
        <div className="flex gap-4">
          {['twitter', 'facebook', 'instagram'].map((social) => (
            <a 
              key={social}
              href={`https://${social}.com`}
              className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-amber-500 hover:text-white transition duration-300"
              aria-label={`Visit our ${social} page`}
            >
              <div className="w-5 h-5 bg-white/20 rounded" />
            </a>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-bold mb-4 text-base text-amber-400">Product</h4>
        <ul className="space-y-3">
          <li><a href="/#features" className="text-sm text-gray-400 hover:text-amber-300 transition duration-200">Features</a></li>
          <li><a href="/#pricing" className="text-sm text-gray-400 hover:text-amber-300 transition duration-200">Pricing</a></li>
          <li><a href="/#faq" className="text-sm text-gray-400 hover:text-amber-300 transition duration-200">FAQ</a></li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold mb-4 text-base text-amber-400">Company</h4>
        <ul className="space-y-3">
          <li><a href="/about" className="text-sm text-gray-400 hover:text-amber-300 transition duration-200">About</a></li>
          <li><a href="/contact" className="text-sm text-gray-400 hover:text-amber-300 transition duration-200">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold mb-4 text-base text-amber-400">Legal</h4>
        <ul className="space-y-3">
          <li><a href="/privacy-policy" className="text-sm text-gray-400 hover:text-amber-300 transition duration-200">Privacy Policy</a></li>
          <li><a href="/cookie-policy" className="text-sm text-gray-400 hover:text-amber-300 transition duration-200">Cookie Policy</a></li>
          <li><a href="/terms" className="text-sm text-gray-400 hover:text-amber-300 transition duration-200">Terms of Service</a></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-gray-800 mt-12 pt-8 text-center">
      <p className="text-sm text-gray-400">
        &copy; {new Date().getFullYear()} Frigo. All rights reserved.
      </p>
      <div className="mt-4 flex items-center justify-center space-x-4">
        <a href="/privacy-policy" className="text-xs text-gray-500 hover:text-amber-300 transition">Privacy</a>
        <span className="text-gray-700">•</span>
        <a href="/terms" className="text-xs text-gray-500 hover:text-amber-300 transition">Terms</a>
        <span className="text-gray-700">•</span>
        <a href="/cookie-policy" className="text-xs text-gray-500 hover:text-amber-300 transition">Cookies</a>
      </div>
    </div>
  </div>
</footer>
    </div>
  );
};

export default LandingPage;
      