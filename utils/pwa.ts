// utils/pwa.js

// Register the service worker
export const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
          });
      });
    } else {
      console.log('Service Worker is not supported in this browser');
    }
  };
  
  // Check if the app is already installed
  export const isAppInstalled = () => {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone || // For iOS
           document.referrer.includes('android-app://');
  };  
  // Check if the app can be installed
  export const canInstallApp = async () => {
    // No prompt means we can't install through the API
    if (!(window as any).deferredPrompt) {
      return false;
    }
    
    // Already installed
    if (isAppInstalled()) {
      return false;
    }
    
    return true;
  };  
  // Prompt the user to install the app
  export const promptInstall = async () => {
    if (!(window as any).deferredPrompt) {
      console.log('No installation prompt available');
      return false;
    }
    
    // Show the installation prompt
    (window as any).deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const choiceResult = await (window as any).deferredPrompt.userChoice;
    
    // Clear the saved prompt since it can only be used once
    (window as any).deferredPrompt = null;
    
    return choiceResult.outcome === 'accepted';
  };