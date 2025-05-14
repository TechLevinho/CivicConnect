import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { QueryClient, QueryClientProvider, QueryFunction } from '@tanstack/react-query';
import { Toaster } from './components/ui/toaster';
import { OfflineAlert } from './components/offline-alert';
import { checkNetworkStatus } from './lib/firebase';

const defaultQueryFn: QueryFunction = async ({ queryKey }) => {
  // Check network status before making API requests
  if (!navigator.onLine) {
    throw new Error('You are currently offline');
  }
  
  if (typeof queryKey[0] === 'string') {
    const response = await fetch(queryKey[0]);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    return response.json();
  }
  throw new Error('Invalid query key');
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      retry: (failureCount, error) => {
        // Don't retry if we're offline
        if (!navigator.onLine) return false;
        return failureCount < 3;
      },
    },
  },
});

function App() {
  // Check network status on app load
  useEffect(() => {
    checkNetworkStatus();
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
          <OfflineAlert />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;