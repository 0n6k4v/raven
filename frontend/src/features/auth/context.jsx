import React, { createContext, useContext } from 'react';
import { useUser } from './hooks';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const auth = useUser();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined || context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};