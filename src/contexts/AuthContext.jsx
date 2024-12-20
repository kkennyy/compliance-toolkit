import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { logAuth, ACTION_TYPES } from '../utils/systemLogger';

export const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (mounted) {
          setSession(initialSession);
          setInitialized(true);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          console.error('Auth initialization error:', err);
          setError(err.message);
          setSession(null);
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (mounted) {
        console.log('Auth state changed:', event, currentSession);
        setSession(currentSession);
        
        if (!initialized) {
          setInitialized(true);
        }
        setLoading(false);

        // Only log auth events after initialization
        if (initialized) {
          try {
            if (event === 'SIGNED_IN') {
              await logAuth(ACTION_TYPES.LOGIN, currentSession?.user?.id, {
                auth_provider: currentSession?.user?.app_metadata?.provider || 'email'
              });
            } else if (event === 'SIGNED_OUT') {
              await logAuth(ACTION_TYPES.LOGOUT, session?.user?.id);
            }
          } catch (error) {
            console.error('Error logging auth event:', error);
          }
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Don't render anything until we've initialized auth
  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Initializing...</div>
      </div>
    );
  }

  const value = {
    session,
    loading,
    error,
    signUp: async (data) => {
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
    },
    signIn: async (data) => {
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
    },
    signOut: async () => {
      try {
        setLoading(true);
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } catch (err) {
        console.error('Sign out error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
