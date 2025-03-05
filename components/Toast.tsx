// components/Toast.tsx
import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'info', 
  duration = 3000, 
  onClose 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default:
        return null;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up">
      <div className={`flex items-center px-4 py-3 rounded-lg shadow-md border ${getStyles()}`}>
        <div className="flex items-center">
          {getIcon()}
          <span className="ml-2">{message}</span>
        </div>
        <button 
          onClick={onClose}
          className="ml-4 p-1 rounded-full hover:bg-black/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Add this to your globals.css or styles
// @keyframes fadeInUp {
//   from {
//     opacity: 0;
//     transform: translate(-50%, 1rem);
//   }
//   to {
//     opacity: 1;
//     transform: translate(-50%, 0);
//   }
// }
// .animate-fade-in-up {
//   animation: fadeInUp 0.3s ease-out;
// }