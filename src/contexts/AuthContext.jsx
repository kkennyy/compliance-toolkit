import React, { createContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (mounted) {
          setSession(data.session);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setSession(null);
          setLoading(false);
        }
        console.error('Auth initialization error:', err);
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (mounted) {
        setSession(currentSession);
        setLoading(false);

        // Log auth state changes for debugging
        console.log('Auth state changed:', event, currentSession);
      }
    });

    // Cleanup
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (data) => {
    try {
      setLoading(true);
      const { data: authData, error } = await supabase.auth.signUp(data);
      if (error) throw error;
      return { data: authData, error: null };
    } catch (err) {
      console.error('Sign up error:', err);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (data) => {
    try {
      setLoading(true);
      const { data: authData, error } = await supabase.auth.signInWithPassword(data);
      if (error) throw error;
      return { data: authData, error: null };
    } catch (err) {
      console.error('Sign in error:', err);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      return { error: null };
    } catch (err) {
      console.error('Sign out error:', err);
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
