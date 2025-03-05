import React, { useState, useEffect, useRef } from 'react';
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../pages/api/firebase";
import { signOut } from "firebase/auth";
import { Menu, X, ChevronDown } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user] = useAuthState(auth);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showUserMenu &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  useEffect(() => {
    // Prevent scrolling when mobile menu is open
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setShowUserMenu(false);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Define menu items based on authentication state
  const getMenuItems = () => {
    const baseItems = [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
    ];

    if (user) {
      return [
        ...baseItems,
        { label: 'Generate', href: '/generate' },
        { label: 'My Recipes', href: '/recipes' },
        { label: 'My Subscription', href: '/subscription' },
      ];
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white bg-opacity-90 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex justify-between items-center relative">
            {/* Logo */}
            <div className="flex items-center">
              <a href="/" className="text-2xl sm:text-3xl font-bold text-[#193722] mr-2">FRIGO</a>
              <img src="/favicon.ico" className="h-6 w-6 sm:h-8 sm:w-8" alt="logo" />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6">
              {menuItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="nav-item text-sm text-gray-600 hover:text-amber-500 transition-colors duration-200"
                >
                  {item.label}
                </a>
              ))}
              
              {user ? (
                <div className="relative" ref={menuRef}>
                  <button
                    ref={buttonRef}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-1 text-gray-600 hover:text-amber-500"
                  >
                    <span className="max-w-[150px] truncate text-sm">{user.email}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-lg shadow-xl border border-gray-100">
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-500"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <a
                    href="/login"
                    className="text-sm text-gray-600 hover:text-amber-500 transition-colors duration-200"
                  >
                    Login
                  </a>
                  <a
                    href="/register"
                    className="text-sm px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors duration-200"
                  >
                    Sign Up
                  </a>
                </div>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 z-50 relative"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-amber-500" />
              ) : (
                <Menu className="h-6 w-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Add padding div for mobile spacing */}
      <div className="h-16 md:h-20"></div>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 bg-white bg-opacity-95 backdrop-blur-lg z-40 md:hidden transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col h-screen justify-center items-center space-y-6 p-4">
          {menuItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-xl font-medium text-gray-800 hover:text-amber-500 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          {user ? (
            <button
              onClick={() => {
                handleSignOut();
                setIsMenuOpen(false);
              }}
              className="text-xl font-medium text-amber-500 hover:text-amber-600 transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <>
              <a
                href="/login"
                className="text-xl font-medium text-gray-800 hover:text-amber-500 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </a>
              <a
                href="/register"
                className="text-xl font-medium text-amber-500 hover:text-amber-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign Up
              </a>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Header;