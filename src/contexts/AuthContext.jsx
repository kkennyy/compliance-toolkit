import React, { createContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initial session check
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        setSession(initialSession);
      } catch (err) {
        setError(err.message);
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // Cleanup subscription
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    loading,
    error,
    signUp: async (data) => {
      try {
        const { data: authData, error } = await supabase.auth.signUp(data);
        if (error) throw error;
        return { data: authData, error: null };
      } catch (err) {
        console.error('Sign up error:', err);
        return { data: null, error: err.message };
      }
    },
    signIn: async (data) => {
      try {
        const { data: authData, error } = await supabase.auth.signInWithPassword(data);
        if (error) throw error;
        return { data: authData, error: null };
      } catch (err) {
        console.error('Sign in error:', err);
        return { data: null, error: err.message };
      }
    },
    signOut: async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { error: null };
      } catch (err) {
        console.error('Sign out error:', err);
        return { error: err.message };
      }
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
