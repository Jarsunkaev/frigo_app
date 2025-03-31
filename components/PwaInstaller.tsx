import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { useRouter } from 'next/router';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PwaInstaller = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const router = useRouter();

  const hiddenPaths = ['/generate'];
  const shouldHideButton = hiddenPaths.includes(router.pathname);

  useEffect(() => {
    if (shouldHideButton) {
      setShowInstallButton(false);
      return;
    }

    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (isAppInstalled) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [shouldHideButton, router.pathname]);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
          setShowInstallButton(false);
        }
        setInstallPrompt(null);
      });
    }
  };

  if (!showInstallButton || shouldHideButton) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={handleInstallClick}
        className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 flex items-center justify-center"
        aria-label="Install app"
      >
        <Download className="w-6 h-6" />
      </button>
    </div>
  );
};

export default PwaInstaller;
