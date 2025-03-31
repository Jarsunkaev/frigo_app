// This file is a small wrapper that registers the service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('Service Worker update found!');
            
            newWorker.addEventListener('statechange', () => {
              console.log('Service Worker state changed:', newWorker.state);
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, we could notify the user here
                console.log('New content is available; please refresh.');
                
                // Optionally show a notification to the user
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('App Update Available', {
                    body: 'New features are available. Refresh to update.',
                    icon: '/icons/icon-192x192.png'
                  });
                }
              }
            });
          });
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    });
    
    // Handle service worker updates
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      console.log('Controller changed, refreshing page to get latest version');
      window.location.reload();
    });
    
    // Request notification permission for update notifications
    if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }