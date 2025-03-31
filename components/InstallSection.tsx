// components/InstallSection.tsx
import React from 'react';
import { Smartphone, ArrowDown } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the PWA install button to avoid SSR issues
const PwaInstallButton = dynamic(() => import('./PwaInstallButton'), {
  ssr: false
});

const InstallSection: React.FC = () => {
  return (
    <section className="py-10 sm:py-12 bg-gradient-to-br from-blue-50 to-amber-50 md:hidden">
      <div className="w-full max-w-md mx-auto px-4 sm:px-6 box-border">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* App Mockup Header */}
          <div className="relative">
            <img 
              src="/app-mockup-header.png" 
              alt="FRIGO app" 
              className="w-full h-auto object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.background = 'linear-gradient(to right, #f59e0b, #fbbf24)';
                target.style.height = '120px';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 flex items-end">
              <div className="p-4 sm:p-6 text-white">
                <h3 className="text-xl sm:text-2xl font-bold">FRIGO</h3>
                <p className="text-white/80 text-sm">Smart Recipe Generator</p>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-amber-100 p-2 rounded-lg">
                <Smartphone className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Install FRIGO App</h2>
                <p className="text-xs text-gray-500">Use offline & get full-screen experience</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-center text-center">
                <img 
                  src="/icon-offline.svg" 
                  alt="Offline Access" 
                  className="w-8 h-8 mb-2"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <span className="text-xs font-medium">Offline Access</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-center text-center">
                <img 
                  src="/icon-faster.svg" 
                  alt="Faster Loading" 
                  className="w-8 h-8 mb-2"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <span className="text-xs font-medium">Faster Loading</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-center text-center">
                <img 
                  src="/icon-homescreen.svg" 
                  alt="Home Screen" 
                  className="w-8 h-8 mb-2"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <span className="text-xs font-medium">Home Screen</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="relative">
                <PwaInstallButton 
                  buttonText="Install FRIGO App" 
                  className="w-full bg-amber-500 text-white py-3 px-6 rounded-lg font-bold hover:bg-amber-600 flex justify-center"
                  showIcon={true}
                />
                <div className="absolute -top-5 right-4">
                  <ArrowDown className="text-amber-500 animate-bounce w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
          
          {/* App Preview */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 mt-4">
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-md">
              <img 
                src="/app-mockup.png" 
                alt="FRIGO app on mobile device" 
                className="w-full h-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='400' viewBox='0 0 300 400' fill='none'%3E%3Crect width='300' height='400' fill='%23f3f4f6'/%3E%3Cpath d='M150 200m-80 0a80 80 0 1 0 160 0a80 80 0 1 0 -160 0' fill='%23d1d5db'/%3E%3Cpath d='M138 160h48v16h-48z' fill='%23f3f4f6'/%3E%3Cpath d='M114 190h96v10h-96z' fill='%23f3f4f6'/%3E%3Cpath d='M114 210h96v10h-96z' fill='%23f3f4f6'/%3E%3Cpath d='M114 230h96v10h-96z' fill='%23f3f4f6'/%3E%3Cpath d='M140 260h44v20h-44z' fill='%23f59e0b'/%3E%3C/svg%3E";
                }}
              />
              <div className="absolute bottom-3 right-3 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                Free Download
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InstallSection;