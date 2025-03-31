// components/PwaInstallButton.tsx
import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Share2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaInstallButtonProps {
  className?: string;
  buttonText?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  showIcon?: boolean;
}

const PwaInstallButton: React.FC<PwaInstallButtonProps> = ({ 
  className = '',
  buttonText = 'Install App',
  variant = 'primary',
  showIcon = true
}) => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if app is already installed/running as PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                 (window.navigator as any).standalone === true;
    
    setIsInstalled(isPWA);

    // Check if device is iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);
    
    // Check if browser is Safari (needed for iOS)
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    setIsSafari(isSafariBrowser);

    // Android/Chrome install prompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else if (installPrompt) {
      // Android/Chrome install flow
      installPrompt.prompt();
      
      try {
        const choiceResult = await installPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
          setIsInstalled(true);
        }
      } catch (error) {
        console.error('Error during install prompt:', error);
      }
      
      setInstallPrompt(null);
    } else {
      console.log('No install prompt available');
      // If we're on a desktop browser without an install prompt
      alert('To install this app: Click the install icon in your browser address bar, or use the browser menu options.');
    }
  };

  // Don't show anything if already installed
  if (isInstalled) {
    return null;
  }

  // FOR iOS: Always show the button, even if no install prompt is available
  // FOR Android/Others: Only show if install prompt is available
  const shouldShowButton = isIOS || installPrompt !== null;
  
  if (!shouldShowButton) {
    return null;
  }

  // Apply different styles based on variant
  let buttonStyle = '';
  switch (variant) {
    case 'primary':
      buttonStyle = 'bg-amber-500 hover:bg-amber-600 text-white';
      break;
    case 'secondary':
      buttonStyle = 'bg-white border border-amber-500 text-amber-500 hover:bg-amber-50';
      break;
    case 'ghost':
      buttonStyle = 'bg-transparent hover:bg-amber-50 text-amber-500';
      break;
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`flex items-center justify-center px-4 py-2.5 rounded-lg transition-colors ${buttonStyle} ${className}`}
      >
        {showIcon && (isIOS ? <Share2 className="w-4 h-4 mr-2" /> : <Download className="w-4 h-4 mr-2" />)}
        {isIOS ? (buttonText === 'Install App' ? 'Add to Home Screen' : buttonText) : buttonText}
      </button>

      {/* iOS Install Instructions Modal */}
      {isIOS && showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="relative bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <button 
              onClick={() => setShowIOSInstructions(false)}
              className="absolute top-2 right-2 p-2 rounded-full text-gray-500 hover:bg-gray-100"
            >
              <span className="sr-only">Close</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center mb-4">
              <Smartphone className="mx-auto mb-2 text-amber-500 w-12 h-12" />
              <h3 className="text-lg font-bold">Install FRIGO on iOS</h3>
              {!isSafari && (
                <p className="text-red-500 text-sm mt-2">⚠️ Please open this page in Safari to install</p>
              )}
            </div>
            
            <ol className="space-y-4 text-sm text-gray-700 mb-6">
              <li className="flex items-start gap-2">
                <div className="bg-amber-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 text-amber-800 font-medium">1</div>
                <div>Tap the <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-gray-800"><Share2 className="w-3 h-3 mr-1" /> Share</span> button at the bottom of Safari</div>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-amber-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 text-amber-800 font-medium">2</div>
                <div>Scroll down and tap <span className="inline-block px-2 py-1 bg-gray-100 rounded text-gray-800">Add to Home Screen</span></div>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-amber-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 text-amber-800 font-medium">3</div>
                <div>Tap <span className="inline-block px-2 py-1 bg-gray-100 rounded text-gray-800">Add</span> in the top right corner</div>
              </li>
            </ol>
            
            <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
              <img 
                src="/pwa-ios-instructions.png" 
                alt="iOS Install Instructions" 
                className="max-w-full max-h-full rounded-lg border border-gray-200 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 14h6v6M3 21l6.1-6.1M20 10h-6V4M21 3l-6.1 6.1'/%3E%3C/svg%3E";
                  target.style.padding = '2rem';
                }}
              />
            </div>
            
            <button 
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PwaInstallButton;