import React from 'react';
import AppNavigation from './src/navigation/AppNavigation';
import { UserProvider } from './src/store/UserContext';

const App = () => {
  return (
    <UserProvider>
      <AppNavigation />
    </UserProvider>
  );
};

export default App;
