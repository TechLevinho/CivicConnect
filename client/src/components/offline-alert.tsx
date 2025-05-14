import { useState, useEffect } from 'react';
import { AlertCircle, WifiOff } from 'lucide-react';

export function OfflineAlert() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Initial state check
    setIsOffline(!navigator.onLine);

    // Add event listeners for online/offline status changes
    const handleOnline = () => {
      setIsOffline(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-red-50 border border-red-200 rounded-md p-4 shadow-lg">
      <div className="flex items-center">
        <WifiOff className="h-5 w-5 text-red-500 mr-2" />
        <h3 className="text-red-800 font-medium">You appear to be offline</h3>
      </div>
      <p className="text-red-700 mt-2">
        Some features may be unavailable until your connection is restored.
      </p>
    </div>
  );
} 