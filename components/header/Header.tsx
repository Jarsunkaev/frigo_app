import React, { useState, useEffect, useRef } from "react";
import "tailwindcss/tailwind.css";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../pages/api/firebase";
import { signOut } from "firebase/auth";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user] = useAuthState(auth);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const toggleMenu = () => setIsMenuOpen((prevState) => !prevState);

  const handleSignOut = () => {
    signOut(auth).catch((error) => {
      console.error("Sign out error:", error);
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !(menuRef.current as HTMLElement).contains(event.target as Node) &&
        buttonRef.current &&
        !(buttonRef.current as HTMLElement).contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const title = document.querySelector('.title');
    if (title && title.textContent) {
      const letters = title.textContent.split('');
      title.innerHTML = letters.map(letter => `<span class="letter">${letter}</span>`).join('');

      const handleMouseMove = (event) => {
        const mouseEvent = event as MouseEvent;
        const { clientX, clientY } = mouseEvent;
        const { left, top, width, height } = title.getBoundingClientRect();
        const mouseX = clientX - left;
        const mouseY = clientY - top;

        const letterNodes = document.querySelectorAll('.letter');
        letterNodes.forEach((letter, index) => {
          const letterRect = letter.getBoundingClientRect();
          const letterCenterX = letterRect.left + letterRect.width / 2 - left;
          const letterCenterY = letterRect.top + letterRect.height / 2 - top;

          const offsetX = mouseX - letterCenterX;
          const offsetY = mouseY - letterCenterY;
          const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);

          const scale = 1 + Math.max(0, (100 - distance) / 100) * 0.5;
          const translateX = offsetX * 0.1;
          const translateY = offsetY * 0.1;

          (letter as HTMLElement).style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        });
      };

      const handleMouseLeave = () => {
        const letterNodes = document.querySelectorAll('.letter');
        letterNodes.forEach(letter => {
          (letter as HTMLElement).style.transform = 'translate(0, 0) scale(1)';
        });
      };

      title.addEventListener('mousemove', handleMouseMove);
      title.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        title.removeEventListener('mousemove', handleMouseMove);
        title.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 50) {
        // Scroll down
        setIsVisible(false);
      } else {
        // Scroll up
        setIsVisible(true);
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]);

  return (
    <nav className={`fixed w-full top-0 z-20 header-blur transition-transform duration-300 ${isVisible ? 'transform translate-y-0' : 'transform -translate-y-full'}`}>
      <div className="flex items-center justify-between py-6 px-4 lg:px-8">
        <div className="flex items-center">
          <a href="/" className="title mr-4">
            FRIGO
          </a>
          <img src="favicon.ico" className="h-8 w-8" alt="logo" />
        </div>

        <div className="hidden lg:flex lg:items-center space-x-6">
          <a href="/" className="nav-item text-lg">Home</a>
          <a href="/about" className="nav-item text-lg">About</a>
          <a href="/recipes" className="nav-item text-lg">My Recipes</a>
          {user ? (
            <button onClick={handleSignOut} className="nav-item text-lg">Sign Out</button>
          ) : (
            <>
              <a href="/login" className="nav-item text-lg">Login</a>
              <a href="/register" className="nav-item text-lg text-amber-500">Sign Up</a>
            </>
          )}
        </div>

        <div className="lg:hidden">
          <button
            ref={buttonRef}
            onClick={toggleMenu}
            className="flex items-center px-3 py-2 border rounded text-slate-900 border-slate-900 hover:text-amber-500 hover:border-amber-500"
          >
            <svg
              className="fill-current h-3 w-3"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Menu</title>
              <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div ref={menuRef} className="lg:hidden absolute w-full bg-fcf9ed shadow-md z-10 mobile-menu">
          <div className="flex flex-col h-screen justify-center items-start px-4 py-6 space-y-4">
            <a href="/" className="nav-item text-xl">Home</a>
            <a href="/about" className="nav-item text-xl">About</a>
            <a href="/recipes" className="nav-item text-xl">My Recipes</a>
            {user ? (
              <button onClick={handleSignOut} className="nav-item text-xl">Sign Out</button>
            ) : (
              <>
                <a href="/login" className="nav-item text-xl">Login</a>
                <a href="/register" className="nav-item text-xl text-amber-500">Sign Up</a>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add the fade effect */}
      <div className="header-fade"></div>
    </nav>
  );
};

export default Header;
