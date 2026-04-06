import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/auth/AuthProvider';
import AppNavigation from './src/navigation/AppNavigation';
import { UserProvider } from './src/store/UserContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnReconnect: true,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UserProvider>
          <AppNavigation />
        </UserProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
