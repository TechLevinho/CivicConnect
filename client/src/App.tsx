import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { QueryClient, QueryClientProvider, QueryFunction } from '@tanstack/react-query';
import { Toaster } from './components/ui/toaster';

const defaultQueryFn: QueryFunction = async ({ queryKey }) => {
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
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppRoutes />
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;