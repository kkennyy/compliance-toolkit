// hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  console.log('useAuth context:', context); // Add this line
  if (!context) {
    console.error('Auth context is null!'); // Add this line
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
