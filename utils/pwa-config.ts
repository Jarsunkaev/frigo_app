// utils/pwa-config.ts

export const PWA_CONFIG = {
    // Allow installation on localhost for development
    allowLocalhost: true,
    
    // Check if current environment is valid for PWA
    isValidEnvironment: (): boolean => {
      if (typeof window === 'undefined') return false;
      
      const isSecure = window.location.protocol === 'https:';
      const isLocalhost = 
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1';
      
      // Allow PWA on HTTPS or on localhost (for development)
      return isSecure || (isLocalhost && PWA_CONFIG.allowLocalhost);
    },
    
    // Get appropriate app icon based on platform
    getAppIcon: (): string => {
      if (typeof window === 'undefined') return '/icons/icon-192x192.png';
      
      // iOS device
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      
      return isIOS 
        ? '/icons/apple-touch-icon.png' 
        : '/icons/icon-192x192.png';
    },
    
    // Get installation instructions based on browser/platform
    getInstallInstructions: (): { title: string; steps: string[] } => {
      if (typeof window === 'undefined') {
        return { 
          title: 'Install App',
          steps: ['Install the app for the best experience']
        };
      }
      
      // Check if it's iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      
      // Check if it's Chrome on Android
      const isAndroidChrome = /Android/.test(navigator.userAgent) && /Chrome\//.test(navigator.userAgent);
      
      if (isIOS) {
        return {
          title: 'Install on iOS',
          steps: [
            'Tap the Share button at the bottom of your browser',
            'Scroll down and tap "Add to Home Screen"',
            'Tap "Add" in the top right corner'
          ]
        };
      } else if (isAndroidChrome) {
        return {
          title: 'Install on Android',
          steps: [
            'Tap the menu button (⋮) in Chrome',
            'Tap "Add to Home screen"',
            'Tap "Add" to confirm'
          ]
        };
      } else {
        return {
          title: 'Install App',
          steps: [
            'Click the install button in your browser address bar',
            'Follow the prompts to install the app'
          ]
        };
      }
    }
  };